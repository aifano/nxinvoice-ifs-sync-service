export interface RepairResult {
    success: boolean;
    data?: any;
    error?: string;
}

/**
 * Attempts to repair common JSON formatting issues and parse the result
 * @param jsonString The potentially malformed JSON string
 * @returns RepairResult with success status and either parsed data or error message
 */
export function repairAndParseJSON(jsonString: string): RepairResult {
    const repairStrategies = [
        // Strategy 1: Fix unescaped quotes in string values (most common issue)
        (json: string) => fixUnescapedQuotesAdvanced(json),

        // Strategy 2: Fix trailing commas
        (json: string) => json.replace(/,(\s*[}\]])/g, '$1'),

        // Strategy 3: Fix missing quotes around property names
        (json: string) => json.replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1"$2":'),

        // Strategy 4: Fix single quotes to double quotes
        (json: string) => json.replace(/'/g, '"'),

        // Strategy 5: Fix common escape sequences
        (json: string) => fixCommonEscapeSequences(json),

        // Strategy 6: Try the original simpler approach
        (json: string) => fixUnescapedQuotes(json),
    ];

    // Try each repair strategy individually first
    for (let i = 0; i < repairStrategies.length; i++) {
        try {
            const repairedJson = repairStrategies[i](jsonString);
            const parsed = JSON.parse(repairedJson);
            return {
                success: true,
                data: parsed
            };
        } catch (error) {
            // Continue to next strategy
            continue;
        }
    }

    // Try combinations of strategies
    for (let i = 0; i < repairStrategies.length; i++) {
        try {
            let repairedJson = jsonString;

            // Apply all strategies up to current one
            for (let j = 0; j <= i; j++) {
                repairedJson = repairStrategies[j](repairedJson);
            }

            const parsed = JSON.parse(repairedJson);
            return {
                success: true,
                data: parsed
            };
        } catch (error) {
            // Continue to next strategy
            continue;
        }
    }

    // If all strategies fail, return error
    return {
        success: false,
        error: 'Unable to repair JSON after trying all strategies'
    };
}

/**
 * Advanced approach to fix unescaped quotes by parsing character by character
 */
function fixUnescapedQuotesAdvanced(jsonString: string): string {
    let result = '';
    let inString = false;
    let inPropertyName = false;
    let escapeNext = false;
    let braceDepth = 0;
    let i = 0;

    while (i < jsonString.length) {
        const char = jsonString[i];

        if (escapeNext) {
            result += char;
            escapeNext = false;
            i++;
            continue;
        }

        if (char === '\\') {
            result += char;
            escapeNext = true;
            i++;
            continue;
        }

        if (char === '{') {
            braceDepth++;
            result += char;
        } else if (char === '}') {
            braceDepth--;
            result += char;
        } else if (char === '"') {
            if (!inString) {
                // Starting a string - determine if it's a property name
                inString = true;
                // Look ahead to see if this is followed by a colon (property name)
                let j = i + 1;
                let foundClosingQuote = false;

                // Find the closing quote
                while (j < jsonString.length && !foundClosingQuote) {
                    if (jsonString[j] === '"' && jsonString[j-1] !== '\\') {
                        foundClosingQuote = true;
                        // Check what comes after the closing quote
                        let k = j + 1;
                        while (k < jsonString.length && /\s/.test(jsonString[k])) k++;
                        inPropertyName = jsonString[k] === ':';
                    }
                    j++;
                }
                result += char;
            } else {
                // We're in a string - check if this is the closing quote
                if (inPropertyName) {
                    // This is a property name, so this quote should close it
                    inString = false;
                    inPropertyName = false;
                    result += char;
                } else {
                    // This is a value string - check if this should be escaped
                    // Look ahead to see if this looks like the end of the value
                    let j = i + 1;
                    while (j < jsonString.length && /\s/.test(jsonString[j])) j++;

                    if (j < jsonString.length && (jsonString[j] === ',' || jsonString[j] === '}')) {
                        // This looks like the end of the value
                        inString = false;
                        result += char;
                    } else {
                        // This is likely an unescaped quote within the value
                        result += '\\"';
                    }
                }
            }
        } else {
            result += char;
        }

        i++;
    }

    return result;
}

/**
 * Fixes unescaped quotes within string values
 * This is the most common issue with the customer's data
 */
function fixUnescapedQuotes(jsonString: string): string {
    // Use a simpler, more reliable approach
    // First, let's try the specific pattern from the example
    let fixed = fixQuotesInDescription(jsonString);

    // If that didn't work, try a more general approach
    if (fixed === jsonString) {
        // Look for patterns like: "property": "value with "quotes" inside"
        // and replace with: "property": "value with \"quotes\" inside"
        fixed = jsonString.replace(
            /("[\w_]+"\s*:\s*"[^"]*?)("(?:[^"]*")*[^"]*?)("(?:\s*[,}]))/g,
            (_fullMatch, prefix, content, suffix) => {
                // Only fix if content contains quotes
                if (content.includes('"')) {
                    const escapedContent = content.replace(/"/g, '\\"');
                    return prefix + escapedContent + suffix;
                }
                return _fullMatch;
            }
        );
    }

    return fixed;
}

/**
 * Fixes common escape sequences that might be malformed
 */
function fixCommonEscapeSequences(jsonString: string): string {
    return jsonString
        // Fix Windows path separators
        .replace(/\\\\/g, '\\\\\\\\')
        // Fix unescaped forward slashes in URLs (optional, but sometimes needed)
        .replace(/(?<!\\)\//g, '\\/')
        // Fix unescaped newlines
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/\t/g, '\\t');
}

/**
 * More sophisticated quote fixing that handles the specific case in the example
 */
export function fixQuotesInDescription(jsonString: string): string {
    // Handle the specific pattern from the example: "DESCRIPTION": "Gerade Einschraubreduzierung IG/AG 1/4"-1\""
    // This pattern has quotes around measurements like 1/4"-1\"

    // Strategy: Find DESCRIPTION field and fix quotes within its value
    return jsonString.replace(
        /"DESCRIPTION"\s*:\s*"([^"]*(?:"[^"]*)*[^"]*)"/g,
        (_match, content) => {
            // Only escape quotes that are not already escaped
            // Use a more compatible approach without negative lookbehind
            let escapedContent = '';
            for (let i = 0; i < content.length; i++) {
                const char = content[i];
                if (char === '"') {
                    // Check if this quote is already escaped
                    if (i > 0 && content[i - 1] === '\\') {
                        // Already escaped, keep as is
                        escapedContent += char;
                    } else {
                        // Not escaped, escape it
                        escapedContent += '\\"';
                    }
                } else {
                    escapedContent += char;
                }
            }
            return `"DESCRIPTION": "${escapedContent}"`;
        }
    );
}
