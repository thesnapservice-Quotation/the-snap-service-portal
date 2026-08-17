'use client';

import { Quotation } from './types';

/**
 * Direct Google Drive OAuth 2.0 & Cloud Storage Engine
 * Direct integration with Google Drive API v3 (https://www.googleapis.com/drive/v3)
 * Allows users to 1-click Sign In with Google and save all quotations to their personal Google Drive.
 */

const GDRIVE_KEYS = {
  ACCESS_TOKEN: 'snap_gdrive_access_token',
  TOKEN_EXPIRY: 'snap_gdrive_token_expiry',
  USER_INFO: 'snap_gdrive_user_info',
  FOLDER_ID: 'snap_gdrive_folder_id',
  CLIENT_ID: 'snap_gdrive_custom_client_id',
};

// Official Google OAuth Client ID for The Snap Service Portal
const DEFAULT_CLIENT_ID =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
  '212632447065-3h30abfhq1064u9ipmto9dhmd84dll4t.apps.googleusercontent.com';

const DRIVE_FOLDER_NAME = 'The Snap Service — Quotations Archive';
const SCOPES = 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile';

export interface GoogleDriveUser {
  email: string;
  name: string;
  picture?: string;
  connectedAt: string;
  folderId?: string;
}

export function getStoredGoogleDriveUser(): GoogleDriveUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const data = localStorage.getItem(GDRIVE_KEYS.USER_INFO);
    if (!data) return null;
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export function getStoredGoogleDriveToken(): string | null {
  if (typeof window === 'undefined') return null;
  const token = localStorage.getItem(GDRIVE_KEYS.ACCESS_TOKEN);
  const expiry = localStorage.getItem(GDRIVE_KEYS.TOKEN_EXPIRY);
  if (!token) return null;
  if (expiry && Date.now() > parseInt(expiry, 10)) {
    // Token expired
    return null;
  }
  return token;
}

export function setGoogleDriveSession(accessToken: string, expiresInSeconds: number, user: GoogleDriveUser) {
  if (typeof window === 'undefined') return;
  const expiryTime = Date.now() + expiresInSeconds * 1000;
  localStorage.setItem(GDRIVE_KEYS.ACCESS_TOKEN, accessToken);
  localStorage.setItem(GDRIVE_KEYS.TOKEN_EXPIRY, expiryTime.toString());
  localStorage.setItem(GDRIVE_KEYS.USER_INFO, JSON.stringify(user));
  if (user.folderId) {
    localStorage.setItem(GDRIVE_KEYS.FOLDER_ID, user.folderId);
  }
}

export function disconnectGoogleDrive() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(GDRIVE_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(GDRIVE_KEYS.TOKEN_EXPIRY);
  localStorage.removeItem(GDRIVE_KEYS.USER_INFO);
  localStorage.removeItem(GDRIVE_KEYS.FOLDER_ID);
}

/**
 * Launch Google OAuth 2.0 Implicit / Token Flow popup
 */
export function initiateGoogleDriveConnect(customClientId?: string): Promise<{ success: boolean; user?: GoogleDriveUser; error?: string }> {
  return new Promise((resolve) => {
    const clientId = (customClientId || '').trim() || localStorage.getItem(GDRIVE_KEYS.CLIENT_ID) || DEFAULT_CLIENT_ID;
    const redirectUri = window.location.origin;

    const authUrl =
      `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${encodeURIComponent(clientId)}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=token&` +
      `scope=${encodeURIComponent(SCOPES)}&` +
      `include_granted_scopes=true&` +
      `prompt=consent`;

    const width = 500;
    const height = 650;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
      authUrl,
      'google_drive_oauth',
      `width=${width},height=${height},left=${left},top=${top},status=no,toolbar=no,menubar=no`
    );

    if (!popup) {
      resolve({ success: false, error: 'Popup blocked by browser. Please allow popups for this site.' });
      return;
    }

    const checkTimer = setInterval(async () => {
      try {
        if (!popup || popup.closed) {
          clearInterval(checkTimer);
          resolve({ success: false, error: 'Sign in window closed before completing.' });
          return;
        }

        const popupUrl = popup.location.href;
        if (popupUrl && popupUrl.startsWith(redirectUri) && popupUrl.includes('access_token')) {
          clearInterval(checkTimer);
          popup.close();

          const hash = popup.location.hash.substring(1);
          const params = new URLSearchParams(hash);
          const accessToken = params.get('access_token');
          const expiresIn = parseInt(params.get('expires_in') || '3600', 10);

          if (!accessToken) {
            resolve({ success: false, error: 'No access token received from Google.' });
            return;
          }

          // 1. Fetch Google User Profile
          const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          const profile = await profileRes.json();

          // 2. Create or find Google Drive Folder
          const folderId = await ensureGoogleDriveFolder(accessToken, DRIVE_FOLDER_NAME);

          const driveUser: GoogleDriveUser = {
            email: profile.email || 'Google Drive User',
            name: profile.name || 'Studio Owner',
            picture: profile.picture,
            connectedAt: new Date().toISOString(),
            folderId,
          };

          setGoogleDriveSession(accessToken, expiresIn, driveUser);
          resolve({ success: true, user: driveUser });
        }
      } catch {
        // Cross-origin access error while on accounts.google.com - ignore until redirect back
      }
    }, 500);
  });
}

/**
 * Ensures the target archive folder exists in user's Google Drive
 */
export async function ensureGoogleDriveFolder(accessToken: string, folderName: string): Promise<string> {
  try {
    const query = `name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
    const searchRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (searchRes.ok) {
      const data = await searchRes.json();
      if (data.files && data.files.length > 0) {
        return data.files[0].id;
      }
    }

    // Create folder if not found
    const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
      }),
    });

    if (createRes.ok) {
      const folderData = await createRes.json();
      return folderData.id;
    }
  } catch (e) {
    console.error('Failed to create/find Google Drive folder', e);
  }
  return 'root';
}

/**
 * Uploads/Updates single quotation file in Google Drive
 */
export async function uploadQuotationDirectToDrive(
  quotation: Quotation,
  accessToken?: string,
  folderId?: string
): Promise<{ success: boolean; fileId?: string; error?: string }> {
  const token = accessToken || getStoredGoogleDriveToken();
  if (!token) return { success: false, error: 'Not connected to Google Drive' };

  const targetFolder = folderId || localStorage.getItem(GDRIVE_KEYS.FOLDER_ID) || 'root';
  const fileName = `${quotation.quotationNumber}_${(quotation.client?.name || 'Client').replace(/[^a-zA-Z0-9]/g, '_')}.json`;
  const fileContent = JSON.stringify(quotation, null, 2);

  try {
    // Check if file already exists in folder
    const searchRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
        `name = '${fileName}' and '${targetFolder}' in parents and trashed = false`
      )}&fields=files(id,name)`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    let existingFileId: string | null = null;
    if (searchRes.ok) {
      const searchData = await searchRes.json();
      if (searchData.files && searchData.files.length > 0) {
        existingFileId = searchData.files[0].id;
      }
    }

    if (existingFileId) {
      // Update existing file content
      const updateRes = await fetch(
        `https://www.googleapis.com/upload/drive/v3/files/${existingFileId}?uploadType=media`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: fileContent,
        }
      );
      if (updateRes.ok) {
        return { success: true, fileId: existingFileId };
      }
    } else {
      // Create new file in folder using multipart upload
      const metadata = {
        name: fileName,
        parents: [targetFolder],
        mimeType: 'application/json',
      };

      const boundary = '-------314159265358979323846';
      const delimiter = `\r\n--${boundary}\r\n`;
      const closeDelim = `\r\n--${boundary}--`;

      const multipartRequestBody =
        delimiter +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        fileContent +
        closeDelim;

      const uploadRes = await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': `multipart/related; boundary=${boundary}`,
          },
          body: multipartRequestBody,
        }
      );

      if (uploadRes.ok) {
        const result = await uploadRes.json();
        return { success: true, fileId: result.id };
      }
    }
  } catch (err: any) {
    console.error('Google Drive direct upload error:', err);
    return { success: false, error: err?.message || String(err) };
  }

  return { success: false, error: 'Upload failed' };
}

/**
 * Uploads all quotations to Google Drive
 */
export async function uploadAllQuotationsDirectToDrive(
  quotations: Quotation[]
): Promise<{ success: boolean; count: number; error?: string }> {
  const token = getStoredGoogleDriveToken();
  if (!token) return { success: false, count: 0, error: 'Not connected to Google Drive' };

  let successCount = 0;
  for (const q of quotations) {
    const res = await uploadQuotationDirectToDrive(q, token);
    if (res.success) successCount++;
  }

  return { success: true, count: successCount };
}
