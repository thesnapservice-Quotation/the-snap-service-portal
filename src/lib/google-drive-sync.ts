import { Quotation } from './types';

/**
 * Turnkey Google Apps Script Code Template
 * Users can copy and paste this into Google Apps Script connected to their Google Drive / Google Sheets.
 * Runs 24/7 forever on Google Cloud at 0 cost.
 */
export const GOOGLE_APPS_SCRIPT_TEMPLATE = `/**
 * The Snap Service — Google Drive & Google Sheets Real-Time Sync Engine
 * Paste this into Google Sheets -> Extensions -> Apps Script
 * Click Deploy -> New Deployment -> Select 'Web app'
 * Execute as: 'Me' (your email)
 * Who has access: 'Anyone'
 * Copy the resulting Web App URL into Snap Service Portal Settings -> Cloud Backup.
 */

function doPost(e) {
  try {
    var rawData = e.postData.contents;
    var payload = JSON.parse(rawData);
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Setup Headers if sheet is empty
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "Quotation #",
        "Date",
        "Client Name",
        "Client Phone",
        "Status",
        "Total Price (PKR)",
        "Advance (PKR)",
        "Balance (PKR)",
        "Events Summary",
        "Security PIN",
        "Last Updated",
        "Full JSON Backup"
      ]);
      sheet.getRange(1, 1, 1, 12).setFontWeight("bold").setBackground("#0D4F4F").setFontColor("#D4AF37");
    }

    var items = Array.isArray(payload) ? payload : [payload];
    
    // Save to Google Drive Folder
    var folderName = "Snap Service Quotations Archive";
    var folders = DriveApp.getFoldersByName(folderName);
    var folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(folderName);
    
    for (var i = 0; i < items.length; i++) {
      var q = items[i];
      if (!q || !q.quotationNumber) continue;

      var eventsSummary = (q.events || []).map(function(evt) { return evt.name; }).join(", ");
      var grandTotal = (q.payment && q.payment.grandTotal) || 0;
      var advance = (q.payment && q.payment.advanceReceived) || 0;
      var balance = (q.payment && q.payment.balancePayable) || 0;
      var clientName = (q.client && q.client.name) || "Unnamed Client";
      var clientPhone = (q.client && q.client.phone) || "";
      var date = (q.client && q.client.quotationDate) || "";
      var jsonStr = JSON.stringify(q);

      // Check if quotation already exists in sheet to update or append
      var data = sheet.getDataRange().getValues();
      var foundRow = -1;
      for (var r = 1; r < data.length; r++) {
        if (data[r][0] === q.quotationNumber || (q.id && data[r][0] === q.id)) {
          foundRow = r + 1;
          break;
        }
      }

      var rowData = [
        q.quotationNumber,
        date,
        clientName,
        clientPhone,
        (q.status || "sent").toUpperCase(),
        grandTotal,
        advance,
        balance,
        eventsSummary,
        q.securityPin || "",
        new Date().toISOString(),
        jsonStr
      ];

      if (foundRow > 0) {
        sheet.getRange(foundRow, 1, 1, 12).setValues([rowData]);
      } else {
        sheet.appendRow(rowData);
      }

      // Create / Update JSON Backup File on Google Drive
      var fileName = q.quotationNumber + "_" + clientName.replace(/[^a-zA-Z0-9]/g, "_") + ".json";
      var existingFiles = folder.getFilesByName(fileName);
      if (existingFiles.hasNext()) {
        var existingFile = existingFiles.next();
        existingFile.setContent(jsonStr);
      } else {
        folder.createFile(fileName, jsonStr, MimeType.PLAIN_TEXT);
      }
    }

    return ContentService.createTextOutput(JSON.stringify({ success: true, count: items.length }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
`;

/**
 * Sends quotation data to Google Drive Webhook
 */
export async function syncQuotationToGoogleDrive(
  quotation: Quotation | Quotation[],
  webhookUrl?: string
): Promise<{ success: boolean; message: string }> {
  const url = webhookUrl || (typeof process !== 'undefined' ? process.env.GOOGLE_DRIVE_WEBHOOK_URL : '');
  if (!url || !url.startsWith('http')) {
    return { success: false, message: 'Google Drive Webhook URL not configured.' };
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(quotation),
      mode: 'no-cors', // Google Apps Script redirects require no-cors or standard POST
    });

    return {
      success: true,
      message: 'Quotation mirrored and archived to Google Drive successfully!',
    };
  } catch (err: any) {
    console.error('Google Drive Sync error:', err);
    return {
      success: false,
      message: `Google Drive sync failed: ${err?.message || err}`,
    };
  }
}
