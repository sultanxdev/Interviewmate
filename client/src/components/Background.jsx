import React from 'react';

/**
 * Aurora Silk Fade — full-screen fixed gradient background.
 * Absolutely no dark mode — always the soft aurora palette.
 */
const Background = () => {
    return (
        <div
            className="fixed inset-0 -z-10 pointer-events-none"
            aria-hidden="true"
            style={{
                background: 'linear-gradient(150deg, #B39DDB 0%, #D1C4E9 20%, #F3E5F5 40%, #FCE4EC 60%, #FFCDD2 80%, #FFAB91 100%)',
            }}
        >
            {/* Subtle animated shimmer orbs for depth */}
            <div
                className="absolute top-[-10%] left-[-10%] h-[600px] w-[600px] rounded-full blur-[140px] opacity-30 animate-float"
                style={{ background: 'radial-gradient(circle, #CE93D8, transparent 70%)' }}
            />
            <div
                className="absolute bottom-[-10%] right-[-10%] h-[500px] w-[500px] rounded-full blur-[120px] opacity-25 animate-float"
                style={{ background: 'radial-gradient(circle, #FFAB91, transparent 70%)', animationDelay: '2s' }}
            />
            <div
                className="absolute top-[50%] left-[60%] h-[350px] w-[350px] rounded-full blur-[100px] opacity-20 animate-float"
                style={{ background: 'radial-gradient(circle, #F48FB1, transparent 70%)', animationDelay: '1s' }}
            />
        </div>
    );
};

export default Background;
