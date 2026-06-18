exports.handler = async function(event) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const body = JSON.parse(event.body);

        // ── Normalize messages ────────────────────────────────────────────────
        // Some history entries use `text` instead of `content` (from agent runs).
        // Strip any message with missing/empty content before sending to Anthropic.
        if (Array.isArray(body.messages)) {
            body.messages = body.messages
                .map(m => ({ role: m.role, content: m.content || m.text || '' }))
                .filter(m => m.content && m.content.trim().length > 0);
        }

        // Guard: must have at least one message
        if (!body.messages || body.messages.length === 0) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: { message: 'No valid messages to send.' } })
            };
        }

        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': process.env.ANTHROPIC_API_KEY,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify(body)
        });

        const data = await response.json();

        return {
            statusCode: response.status,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify(data)
        };
    } catch (err) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: err.message })
        };
    }
};