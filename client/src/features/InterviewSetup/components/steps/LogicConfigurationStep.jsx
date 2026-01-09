import React from 'react'
import { Brain, Globe, Zap } from 'lucide-react'
import { INTERVIEW_MODES } from '../../../../constants'

const LogicConfigurationStep = ({ formData, handleInputChange, vapiCost, canAffordVapi }) => {
    return (
        <div className="glass-card !p-8 rounded-3xl animate-fade-in text-slate-900">
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black flex items-center">
                    <Brain className="w-6 h-6 mr-3 text-brand-600" />
                    Logic Configuration
                </h2>
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-3 py-1 bg-slate-50 rounded-lg">Step 03 / 03</div>
            </div>

            <div className="mb-12">
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-6 ml-1">Agent Interaction Suite</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Lite */}
                    <div
                        onClick={() => handleInputChange('configuration', 'interviewMode', INTERVIEW_MODES.WEB_SPEECH)}
                        className={`relative p-6 rounded-3xl border-2 transition-all duration-300 cursor-pointer ${formData.configuration.interviewMode === INTERVIEW_MODES.WEB_SPEECH
                            ? 'border-brand-500 bg-brand-50/30'
                            : 'border-slate-100 bg-white/50 hover:border-slate-200'
                            }`}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-soft text-slate-400">
                                <Globe className={`w-6 h-6 ${formData.configuration.interviewMode === INTERVIEW_MODES.WEB_SPEECH ? 'text-brand-500' : ''}`} />
                            </div>
                            <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-wider rounded-lg">Unlimited Free</span>
                        </div>
                        <h3 className="font-black mb-2">Web Speech Protocol</h3>
                        <p className="text-[11px] text-slate-500 font-medium leading-relaxed mb-4">Autonomous agent driven by browser engine. Reliable, fast, and completely free of charge.</p>
                    </div>

                    {/* Pro */}
                    <div
                        onClick={() => handleInputChange('configuration', 'interviewMode', INTERVIEW_MODES.VAPI)}
                        className={`relative p-6 rounded-3xl border-2 transition-all duration-300 cursor-pointer ${formData.configuration.interviewMode === INTERVIEW_MODES.VAPI
                            ? 'border-brand-500 bg-brand-50/30 shadow-premium'
                            : 'border-slate-100 bg-white/50 hover:border-slate-200'
                            }`}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center shadow-lg text-white">
                                <Zap className={`w-6 h-6 ${formData.configuration.interviewMode === INTERVIEW_MODES.VAPI ? 'text-brand-400' : ''}`} />
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="px-3 py-1 bg-brand-500 text-white text-[10px] font-black uppercase tracking-wider rounded-lg shadow-glow">Premium Adaptive</span>
                                <span className="text-[10px] font-bold text-slate-400 mt-1">₹{vapiCost} Est.</span>
                            </div>
                        </div>
                        <h3 className="font-black mb-2">Neural Voice Synthesis</h3>
                        <p className="text-[11px] text-slate-500 font-medium leading-relaxed mb-4">High-fidelity neural voices with sub-second latency. Perfect for serious simulation.</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default LogicConfigurationStep
