import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const TokenBalance = ({ className = '' }) => {
    const { tokenBalance } = useAuth();

    return (
        <div className={`flex items-center space-x-2 ${className}`}>
            <div className="flex items-center px-3 py-1.5 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-full">
                <svg
                    className="w-4 h-4 text-amber-500 mr-1.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                >
                    <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.736 6.979C9.208 6.193 9.696 6 10 6c.304 0 .792.193 1.264.979a1 1 0 001.715-1.029C12.279 4.784 11.232 4 10 4s-2.279.784-2.979 1.95c-.285.475-.507 1-.67 1.55H6a1 1 0 000 2h.013a9.358 9.358 0 000 1H6a1 1 0 100 2h.351c.163.55.385 1.075.67 1.55C7.721 15.216 8.768 16 10 16s2.279-.784 2.979-1.95a1 1 0 10-1.715-1.029c-.472.786-.96.979-1.264.979-.304 0-.792-.193-1.264-.979a4.265 4.265 0 01-.264-.521H10a1 1 0 100-2H8.017a7.36 7.36 0 010-1H10a1 1 0 100-2H8.472c.08-.185.167-.36.264-.521z" />
                </svg>
                <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                    {tokenBalance}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">tokens</span>
            </div>
        </div>
    );
};

export default TokenBalance;
