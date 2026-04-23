import { useState } from 'react';

export default function ScreenShareSelector({ onSelect, onCancel }) {
    const [selectedOption, setSelectedOption] = useState(null);

    const handleSelect = (option) => {
        setSelectedOption(option);
    };

    const handleShare = () => {
        if (selectedOption) {
            onSelect(selectedOption);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
        }}>
            <div style={{
                background: '#fff',
                borderRadius: 8,
                padding: 20,
                width: 600,
                maxWidth: '90%',
            }}>
                <h3 style={{ marginTop: 0, color: '#333' }}>Select a window or an application that you want to share</h3>

                <div style={{ display: 'flex', margin: '20px 0', gap: 15 }}>
                    {/* Option Entire Screen */}
                    <div
                        onClick={() => handleSelect('screen')}
                        style={{
                            flex: 1,
                            padding: 10,
                            border: selectedOption === 'screen' ? '2px solid #0078d4' : '1px solid #ccc',
                            borderRadius: 4,
                            background: selectedOption === 'screen' ? 'rgba(0, 120, 212, 0.1)' : '#f9f9f9',
                            cursor: 'pointer',
                            textAlign: 'center',
                        }}
                    >
                        <div style={{ background: '#0078d4', color: '#fff', padding: 10, borderRadius: 4, marginBottom: 5 }}>
                            <svg width="50" height="30" viewBox="0 0 50 30" style={{ display: 'block', margin: '0 auto' }}>
                                <rect x="2" y="2" width="46" height="26" rx="2" fill="#fff" stroke="#0078d4" strokeWidth="2" />
                            </svg>
                        </div>
                        <div style={{ fontWeight: 'bold' }}>Entire Screen</div>
                        <div style={{ fontSize: '0.8em', color: '#666' }}>Screen</div>
                    </div>

                    {/* Option Application Window */}
                    <div
                        onClick={() => handleSelect('window')}
                        style={{
                            flex: 1,
                            padding: 10,
                            border: selectedOption === 'window' ? '2px solid #0078d4' : '1px solid #ccc',
                            borderRadius: 4,
                            background: selectedOption === 'window' ? 'rgba(0, 120, 212, 0.1)' : '#f9f9f9',
                            cursor: 'pointer',
                            textAlign: 'center',
                        }}
                    >
                        <div style={{ background: '#0078d4', color: '#fff', padding: 10, borderRadius: 4, marginBottom: 5 }}>
                            <svg width="50" height="30" viewBox="0 0 50 30" style={{ display: 'block', margin: '0 auto' }}>
                                <rect x="5" y="5" width="40" height="20" rx="2" fill="#fff" stroke="#0078d4" strokeWidth="2" />
                            </svg>
                        </div>
                        <div style={{ fontWeight: 'bold' }}>Application Window</div>
                    </div>

                    {/* Option Tab */}
                    <div
                        onClick={() => handleSelect('tab')}
                        style={{
                            flex: 1,
                            padding: 10,
                            border: selectedOption === 'tab' ? '2px solid #0078d4' : '1px solid #ccc',
                            borderRadius: 4,
                            background: selectedOption === 'tab' ? 'rgba(0, 120, 212, 0.1)' : '#f9f9f9',
                            cursor: 'pointer',
                            textAlign: 'center',
                        }}
                    >
                        <div style={{ background: '#0078d4', color: '#fff', padding: 10, borderRadius: 4, marginBottom: 5 }}>
                            <svg width="50" height="30" viewBox="0 0 50 30" style={{ display: 'block', margin: '0 auto' }}>
                                <rect x="10" y="5" width="30" height="20" rx="2" fill="#fff" stroke="#0078d4" strokeWidth="2" />
                            </svg>
                        </div>
                        <div style={{ fontWeight: 'bold' }}>Tab</div>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                    <button
                        onClick={onCancel}
                        style={{
                            padding: '8px 16px',
                            border: '1px solid #ccc',
                            borderRadius: 4,
                            background: '#fff',
                            cursor: 'pointer',
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleShare}
                        style={{
                            padding: '8px 16px',
                            border: 'none',
                            borderRadius: 4,
                            background: '#0078d4',
                            color: '#fff',
                            cursor: 'pointer',
                        }}
                    >
                        Share
                    </button>
                </div>
            </div>
        </div>
    );
}