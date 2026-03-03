import React from 'react';

/**
 * Animated ambient background — works in both light and dark mode.
 * Uses CSS custom properties from index.css.
 */
const Background = () => {
    return (
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden="true">
            {/* Main gradient */}
            <div className="absolute inset-0"
                style={{
                    background: `
                        radial-gradient(ellipse 80% 60% at 50% -20%, hsl(var(--primary)/0.18) 0%, transparent 70%),
                        radial-gradient(ellipse 60% 40% at 80% 80%, hsl(var(--accent)/0.14) 0%, transparent 60%),
                        hsl(var(--background))
                    `,
                }}
            />

            {/* Subtle grid dot pattern */}
            <div className="absolute inset-0 grid-bg opacity-40" />

            {/* Animated orbs */}
            <div
                className="absolute top-1/4 left-1/4 h-[500px] w-[500px] rounded-full blur-[120px] opacity-[0.07] animate-float"
                style={{ background: 'hsl(var(--primary))' }}
            />
            <div
                className="absolute bottom-1/4 right-1/4 h-[400px] w-[400px] rounded-full blur-[100px] opacity-[0.05] animate-float"
                style={{ background: '#f59e0b', animationDelay: '1.5s' }}
            />
        </div>
    );
};

export default Background;
