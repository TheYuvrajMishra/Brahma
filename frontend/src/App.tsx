import { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
    id: string;
    sender: 'You' | 'Brahma Core';
    text: string;
}

export default function App() {
    const [socket, setSocket] = useState<any>(null);
    const [connected, setConnected] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { id: '1', sender: 'Brahma Core', text: 'Welcome to the Playground. I am online and ready to execute.' }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Connect to the backend socket
        const newSocket = io('http://127.0.0.1:3005');
        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log('Connected to backend');
            setConnected(true);
        });
        newSocket.on('disconnect', () => {
            console.log('Disconnected from backend');
            setConnected(false);
        });
        newSocket.on('connect_error', (err) => {
            console.error('Socket connection error:', err);
        });

        newSocket.on('typing', (typingState: boolean) => {
            setIsTyping(typingState);
        });

        newSocket.on('chat response', (msg: string) => {
            setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'Brahma Core', text: msg }]);
        });

        return () => {
            newSocket.disconnect();
        };
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isTyping]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const text = inputValue.trim();
        if (text && socket) {
            setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'You', text }]);
            socket.emit('chat message', text);
            setInputValue('');
        }
    };

    return (
        <div className="h-screen w-full bg-pink-100 flex flex-col items-center justify-center p-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            
            {/* Header */}
            <div className="w-full max-w-4xl flex items-center justify-between bg-yellow-300 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-4 mb-6">
                <h1 className="text-3xl font-bold uppercase tracking-tight">Brahma Playground</h1>
                <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-full border-2 border-black ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="font-bold">{connected ? 'Connected' : 'Disconnected'}</span>
                </div>
            </div>

            {/* Chat Container */}
            <div className="w-full max-w-4xl flex-1 bg-white border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col overflow-hidden mb-6">
                
                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 bg-cyan-100">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex flex-col ${msg.sender === 'You' ? 'items-end' : 'items-start'}`}>
                            <div className={`
                                border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4 max-w-[80%] 
                                ${msg.sender === 'You' ? 'bg-white rounded-bl-2xl rounded-tl-2xl rounded-tr-2xl' : 'bg-yellow-200 rounded-br-2xl rounded-tr-2xl rounded-tl-2xl'}
                            `}>
                                <p className="font-bold mb-2 text-sm uppercase opacity-70 text-black">{msg.sender}</p>
                                <div className="prose prose-sm max-w-none text-black">
                                    {msg.sender === 'Brahma Core' ? (
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
                                    ) : (
                                        <p className="whitespace-pre-wrap">{msg.text}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                    
                    <div ref={messagesEndRef} />
                </div>

                {/* Typing Indicator */}
                {isTyping && (
                    <div className="px-6 py-2 bg-cyan-100 border-t-4 border-black">
                        <p className="font-bold animate-pulse text-sm text-black">Brahma is thinking...</p>
                    </div>
                )}

                {/* Input Area */}
                <form onSubmit={handleSubmit} className="bg-white border-t-4 border-black p-4 flex gap-4">
                    <input 
                        type="text" 
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        className="flex-1 border-4 border-black p-3 font-bold focus:outline-none focus:bg-pink-100 transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                        placeholder="Enter your command..."
                        autoComplete="off"
                    />
                    <button 
                        type="submit" 
                        className="bg-blue-500 hover:bg-blue-400 text-white font-bold px-8 py-3 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] uppercase tracking-wider transition-transform active:translate-x-1 active:translate-y-1 active:shadow-none cursor-pointer"
                    >
                        Send
                    </button>
                </form>
            </div>
        </div>
    );
}
