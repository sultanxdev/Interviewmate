import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const PricingModal = ({ isOpen, onClose }) => {
    const { refreshTokenBalance } = useAuth();
    const [loading, setLoading] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState(null);

    const plans = [
        {
            id: 'tokens_50',
            name: '50 Tokens',
            price: 199,
            tokens: 50,
            description: '5 sessions',
            popular: false
        },
        {
            id: 'tokens_150',
            name: '150 Tokens',
            price: 499,
            tokens: 150,
            description: '15 sessions',
            popular: true,
            savings: '17% off'
        },
        {
            id: 'tokens_500',
            name: '500 Tokens',
            price: 1499,
            tokens: 500,
            description: '50 sessions',
            popular: false,
            savings: '40% off'
        },
        {
            id: 'pro_monthly',
            name: 'Pro Monthly',
            price: 999,
            tokens: 200,
            description: '200 tokens/month + priority support',
            popular: false,
            isSubscription: true
        }
    ];

    const loadRazorpay = () => {
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handlePurchase = async (plan) => {
        setLoading(true);
        setSelectedPlan(plan.id);

        try {
            const loaded = await loadRazorpay();
            if (!loaded) {
                alert('Failed to load payment gateway');
                return;
            }

            // Create order
            const orderResponse = await axios.post('/api/payment/create-order', {
                plan: plan.id,
                amount: plan.price
            });

            const { orderId, amount, currency, key } = orderResponse.data;

            const options = {
                key,
                amount,
                currency,
                name: 'Interviewmate',
                description: `${plan.name} - ${plan.tokens} tokens`,
                order_id: orderId,
                handler: async (response) => {
                    try {
                        // Verify payment
                        await axios.post('/api/payment/verify-payment', {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            plan: plan.id,
                            tokens: plan.tokens
                        });

                        // Refresh token balance
                        await refreshTokenBalance();
                        onClose();
                        alert('Payment successful! Tokens added to your account.');
                    } catch (err) {
                        console.error('Verification failed:', err);
                        alert('Payment verification failed. Please contact support.');
                    }
                },
                prefill: {
                    name: '',
                    email: '',
                },
                theme: {
                    color: '#8b5cf6'
                }
            };

            const razorpay = new window.Razorpay(options);
            razorpay.open();

        } catch (err) {
            console.error('Payment error:', err);
            alert('Failed to initiate payment');
        } finally {
            setLoading(false);
            setSelectedPlan(null);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-background rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-primary/10 shadow-2xl">
                {/* Header */}
                <div className="p-8 border-b border-primary/5">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-3xl font-heading font-bold text-foreground tracking-tight">Get More Tokens</h2>
                            <p className="text-muted-foreground font-medium">Choose a plan that works for you</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-card/10 rounded-lg transition-colors"
                        >
                            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Plans */}
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {plans.map(plan => (
                        <div
                            key={plan.id}
                            className={`relative p-6 rounded-xl border-2 transition-all ${plan.popular
                                ? 'border-primary bg-primary text-primary-foreground shadow-xl scale-[1.05] z-10'
                                : 'border-white/10 hover:border-white/30'
                                }`}
                        >
                            {plan.popular && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-primary-foreground shadow-lg px-4 py-1.5 rounded-full text-[10px] tracking-widest uppercase font-black -top-4">
                                    POPULAR
                                </div>
                            )}

                            <h3 className="text-lg font-heading font-bold text-foreground mb-1">{plan.name}</h3>
                            <p className="text-gray-400 text-sm mb-4">{plan.description}</p>

                            <div className="mb-4">
                                <span className="text-3xl font-bold text-white">₹{plan.price}</span>
                                {plan.isSubscription && <span className="text-gray-400">/mo</span>}
                            </div>

                            {plan.savings && (
                                <div className="mb-4 px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full inline-block">
                                    {plan.savings}
                                </div>
                            )}

                            <div className="flex items-center text-gray-400 text-sm mb-4">
                                <svg className="w-4 h-4 mr-2 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.736 6.979C9.208 6.193 9.696 6 10 6c.304 0 .792.193 1.264.979a1 1 0 001.715-1.029C12.279 4.784 11.232 4 10 4s-2.279.784-2.979 1.95c-.285.475-.507 1-.67 1.55H6a1 1 0 000 2h.013a9.358 9.358 0 000 1H6a1 1 0 100 2h.351c.163.55.385 1.075.67 1.55C7.721 15.216 8.768 16 10 16s2.279-.784 2.979-1.95a1 1 0 10-1.715-1.029c-.472.786-.96.979-1.264.979-.304 0-.792-.193-1.264-.979a4.265 4.265 0 01-.264-.521H10a1 1 0 100-2H8.017a7.36 7.36 0 010-1H10a1 1 0 100-2H8.472c.08-.185.167-.36.264-.521z" />
                                </svg>
                                {plan.tokens} tokens
                            </div>

                            <button
                                onClick={() => handlePurchase(plan)}
                                disabled={loading}
                                className={`w-full py-3 rounded-lg font-semibold transition-all ${plan.popular
                                    ? 'bg-purple-500 text-white hover:bg-purple-600'
                                    : 'bg-secondary text-foreground hover:bg-secondary/80 font-bold h-12 transition-all duration-300'
                                    } ${loading && selectedPlan === plan.id ? 'opacity-50 cursor-wait' : ''}`}
                            >
                                {loading && selectedPlan === plan.id ? 'Processing...' : 'Buy Now'}
                            </button>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/10 text-center">
                    <p className="text-gray-500 text-sm">
                        Secure payments powered by Razorpay. All transactions are encrypted.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PricingModal;
