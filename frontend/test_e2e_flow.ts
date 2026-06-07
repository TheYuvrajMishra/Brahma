import { io } from 'socket.io-client';

const socket = io('http://localhost:3005');
const sessionId = 'session_1780822545524_8075';

socket.on('connect', () => {
    console.log('[TestClient] Connected to server.');
    
    // Step 1: Change sleep time
    console.log('[TestClient] Sending message: "change sleep time to 1 AM"');
    socket.emit('chat message', {
        text: 'change sleep time to 1 AM',
        sessionId: sessionId
    });
});

socket.on('typing', (isTyping) => {
    console.log(`[TestClient] Server typing indicator: ${isTyping}`);
});

socket.on('chat response', (response: string) => {
    console.log('[TestClient] Received response:\n', response);
    
    // We will analyze the response and then send "krdo update" if it's the first step
    if (response.toLowerCase().includes('1 am') || response.toLowerCase().includes('sleep')) {
        console.log('[TestClient] Step 1 complete. Now sending follow-up: "krdo update"');
        socket.emit('chat message', {
            text: 'krdo update',
            sessionId: sessionId
        });
    } else if (response.toLowerCase().includes('spreadsheet') || response.toLowerCase().includes('update') || response.toLowerCase().includes('link')) {
        console.log('[TestClient] Step 2 complete. Spreadsheet successfully updated!');
        socket.disconnect();
        process.exit(0);
    } else {
        console.log('[TestClient] Unexpected response, disconnecting.');
        socket.disconnect();
        process.exit(1);
    }
});

socket.on('disconnect', () => {
    console.log('[TestClient] Disconnected from server.');
});

socket.on('connect_error', (err) => {
    console.error('[TestClient] Connection error:', err);
    process.exit(1);
});

// Set a timeout to prevent hanging forever
setTimeout(() => {
    console.error('[TestClient] Test timed out after 90 seconds.');
    socket.disconnect();
    process.exit(1);
}, 90000);
