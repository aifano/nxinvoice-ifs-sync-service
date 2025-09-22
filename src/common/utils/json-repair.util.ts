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

function fixUnescapedQuotesAdvanced(jsonString: string): string {
    // This is a more sophisticated approach to fix unescaped quotes
    // It tries to identify string values and properly escape quotes within them
    
    let fixed = jsonString;
    
    // Pattern to match: "key": "value with "quotes" inside"
    // We want to fix the quotes inside the value
    const pattern = /("[\w_]+"\s*:\s*")([^"]*(?:"[^"]*")*[^"]*)("(?:\s*[,}]))/g;
    
    fixed = fixed.replace(pattern, (fullMatch, prefix, content, suffix) => {
        // Only process if content contains unescaped quotes
        if (content.includes('"') && !content.includes('\\"')) {
            // Escape all quotes in the content
            const escapedContent = content.replace(/"/g, '\\"');
            return prefix + escapedContent + suffix;
        }
        return fullMatch;
    });

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

function fixCommonEscapeSequences(jsonString: string): string {
    return jsonString
        .replace(/\\n/g, '\\n')  // Fix newlines
        .replace(/\\t/g, '\\t')  // Fix tabs
        .replace(/\\r/g, '\\r')  // Fix carriage returns
        .replace(/\\\\/g, '\\\\'); // Fix backslashes
}

function fixUnescapedQuotes(jsonString: string): string {
    // Simple approach: find and escape quotes that are not already escaped
    return jsonString.replace(/(?<!\\)"/g, (match, offset) => {
        // Don't escape quotes that are part of property names or string delimiters
        const beforeChar = jsonString[offset - 1];
        const afterChar = jsonString[offset + 1];
        
        // If it's likely a string delimiter, don't escape
        if (beforeChar === ':' || beforeChar === '{' || beforeChar === ',' || 
            afterChar === ':' || afterChar === '}' || afterChar === ',') {
            return match;
        }
        
        return '\\"';
    });
}
