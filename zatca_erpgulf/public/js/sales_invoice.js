frappe.ui.form.on('Sales Invoice', {
    refresh: function(frm) {
        if (frm.doc.custom_zatca_full_response) {
            format_zatca_response(frm);
        }
    },

    custom_zatca_full_response: function(frm) {
        if (frm.doc.custom_zatca_full_response) {
            format_zatca_response(frm);
        }
    }
});

function format_zatca_response(frm) {
    let response = frm.doc.custom_zatca_full_response;
    let message = '';

    try {
        let response_lower = response.toLowerCase();
        let json_start = response.indexOf('{');

        if (json_start > -1) {
            let json_str = response.substring(json_start);

            // Clean the JSON string in case there are extra characters before or after it
            let cleanedJsonStr = extractValidJson(json_str);

            if (cleanedJsonStr) {
                let data = JSON.parse(cleanedJsonStr);

                if (data.status === 'ERROR' || response_lower.includes('status code: 400')) {
                    message = format_error_response(data);
                } else if (data.status === 'PASS' || response_lower.includes('status code: 200')) {
                    message = format_success_response(data);
                }
            } else {
                message = __('Invalid JSON structure in the response');
            }
        } else if (response_lower.includes('success') || response_lower.includes('status code: 200')) {
            message = __('<b>ZATCA Submission Successful</b><br>Invoice successfully cleared by ZATCA ✅');
        } else if (response_lower.includes('error') || response_lower.includes('status code: 400')) {
            message = __('<b>ZATCA Submission Failed</b><br>Validation errors occurred ❌');
        }

        // Set the intro message on the form
        frm.set_intro(message);

        // Show attractive message using msgprint
        if (message) {
            let indicator = message.includes('Failed') ? 'red' : 'green';
            frappe.msgprint({
                title: message.includes('Failed') ? __('ZATCA Submission Failed') : __('ZATCA Submission Successful'),
                message: message,
                indicator: indicator,
                // Adding emoji and colored message for better visual feedback
                icon: message.includes('Failed') ? 'octicon octicon-alert' : 'octicon octicon-check-circle'
            });
        } else {
            frappe.msgprint('No matching message found in response');
        }
    } catch (e) {
        console.error('Error parsing ZATCA response:', e);
        frappe.msgprint('Error parsing ZATCA response: ' + e.message);
    }
}

// Function to extract and clean JSON portion from the response string
function extractValidJson(response) {
    const jsonPattern = /({.*})/s;
    const match = response.match(jsonPattern);

    if (match) {
        return match[0];  // Return the matched valid JSON string
    }
    return null;  // Return null if no valid JSON found
}

function format_error_response(data) {
    let message = __('<b>ZATCA Submission Failed</b><br>❌ ');

    if (data.validationResults) {
        if (data.validationResults.errorMessages?.length) {
            message += __('<b>Errors:</b><br>');
            data.validationResults.errorMessages.forEach(err => {
                message += `- ${err.message}<br>`;
            });
        }

        if (data.validationResults.warningMessages?.length) {
            message += __('<b>Warnings:</b><br>');
            data.validationResults.warningMessages.forEach(warn => {
                message += `- ${warn.message}<br>`;
            });
        }

        if (data.validationResults.infoMessages?.length) {
            message += __('<b>Information:</b><br>');
            data.validationResults.infoMessages.forEach(info => {
                message += `- ${info.message}<br>`;
            });
        }
    }

    return message;
}

function format_success_response(data) {
    let message = __('<b>ZATCA Submission Successful</b><br>✅ ');

    if (data.validationResults?.infoMessages?.length) {
        message += __('<b>Validation Results:</b><br>');
        data.validationResults.infoMessages.forEach(info => {
            message += `- ${info.message}<br>`;
        });
    }

    if (data.clearanceStatus) {
        message += __('<b>Clearance Status:</b> ') + data.clearanceStatus + '<br>';
    }

    if (data.clearedInvoice) {
        message += __('<b>Invoice Cleared:</b> Yes<br>');
    }

    return message;
}
