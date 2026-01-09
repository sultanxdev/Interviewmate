import React from 'react'
import { Globe, Code, Users, Plus, X, FileText, Trash2, CheckCircle } from 'lucide-react'
import { INTERVIEW_TYPE_LABELS, INTERVIEW_TYPE_DESCRIPTIONS } from '../../../../constants'

const InterviewContextStep = ({
    formData,
    handleInputChange,
    handleTopicToggle,
    availableTopics,
    customTopicInput,
    setCustomTopicInput,
    addCustomTopic,
    removeCustomTopic,
    customQuestionInput,
    setCustomQuestionInput,
    addCustomQuestion,
    removeCustomQuestion
}) => {
    return (
        <div className="space-y-8 animate-fade-in">
            <div className="glass-card !p-8 rounded-3xl">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-black text-slate-900 flex items-center">
                        <Globe className="w-6 h-6 mr-3 text-brand-600" />
                        Domain Context
                    </h2>
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-3 py-1 bg-slate-50 rounded-lg">Step 02 / 03</div>
                </div>

                {/* Interview Type Cards */}
                <div className="mb-10">
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-4 ml-1">Mission Type</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {Object.entries(INTERVIEW_TYPE_LABELS).map(([type, label]) => (
                            <div
                                key={type}
                                className={`relative p-5 rounded-2xl border-2 transition-all duration-300 group cursor-pointer ${formData.type === type
                                    ? 'border-brand-500 bg-brand-50/50 shadow-soft'
                                    : 'border-slate-100 hover:border-slate-200 bg-white/50'
                                    }`}
                                onClick={() => handleInputChange(null, 'type', type)}
                            >
                                <div className={`p-2 w-fit rounded-lg mb-4 transition-colors ${formData.type === type ? 'bg-brand-500 text-white' : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100'}`}>
                                    {type === 'technical' ? <Code className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                                </div>
                                <h3 className="text-sm font-black text-slate-900 mb-1">{label}</h3>
                                <p className="text-[10px] font-medium text-slate-500 leading-relaxed uppercase tracking-tighter">
                                    {INTERVIEW_TYPE_DESCRIPTIONS[type]}
                                </p>
                                {formData.type === type && (
                                    <div className="absolute top-3 right-3">
                                        <CheckCircle className="w-4 h-4 text-brand-500 fill-white" />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Job Description Text */}
                <div className="mb-10">
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-3 ml-1">Contextual Directives</label>
                    <textarea
                        value={formData.configuration.jobDescription}
                        onChange={(e) => handleInputChange('configuration', 'jobDescription', e.target.value)}
                        rows={4}
                        className="input-premium h-40 resize-none py-4"
                        placeholder="Paste the target job description or core focus points..."
                    />
                </div>

                {/* Primary Focus Topics */}
                <div className="mb-10">
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-4 ml-1">Strategic Focus Areas</label>
                    <div className="flex flex-wrap gap-2">
                        {availableTopics.map((topic) => (
                            <button
                                key={topic}
                                type="button"
                                onClick={() => handleTopicToggle(topic)}
                                className={`px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all border ${formData.configuration.topics.includes(topic)
                                    ? 'bg-brand-600 border-brand-600 text-white shadow-premium'
                                    : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200 hover:text-slate-600'
                                    }`}
                            >
                                {topic}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Custom Topics */}
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                    <label className="block text-xs font-black text-slate-900 uppercase tracking-widest mb-4">Inject Custom Topics</label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={customTopicInput}
                            onChange={(e) => setCustomTopicInput(e.target.value)}
                            className="flex-1 input-premium !bg-white"
                            placeholder="Add niche skill (e.g. gRPC, Vite, etc.)"
                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomTopic())}
                        />
                        <button type="button" onClick={addCustomTopic} className="bg-brand-600 text-white p-3 rounded-xl hover:bg-brand-700 shadow-soft">
                            <Plus className="w-5 h-5" />
                        </button>
                    </div>
                    {formData.configuration.customTopics.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-4">
                            {formData.configuration.customTopics.map(t => (
                                <span key={t} className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-black uppercase text-brand-600 flex items-center shadow-soft">
                                    {t}
                                    <X className="w-3 h-3 ml-2 cursor-pointer text-slate-300 hover:text-red-500" onClick={() => removeCustomTopic(t)} />
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Custom Questions */}
            <div className="glass-card !p-8 rounded-3xl mt-8">
                <h3 className="text-lg font-black text-slate-900 flex items-center mb-6">
                    <FileText className="w-5 h-5 mr-2 text-brand-600" />
                    Override Questions
                </h3>
                <div className="flex gap-2 mb-6">
                    <input
                        type="text"
                        value={customQuestionInput}
                        onChange={(e) => setCustomQuestionInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomQuestion())}
                        className="flex-1 input-premium"
                        placeholder="Add a custom mandatory question..."
                    />
                    <button type="button" onClick={addCustomQuestion} className="bg-brand-600 text-white p-3 rounded-xl hover:bg-brand-700 shadow-soft">
                        <Plus className="w-5 h-5" />
                    </button>
                </div>
                {formData.configuration.customQuestions.length > 0 && (
                    <div className="space-y-3">
                        {formData.configuration.customQuestions.map((question, index) => (
                            <div key={index} className="flex items-start gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 group">
                                <div className="w-6 h-6 flex-shrink-0 bg-white rounded-lg flex items-center justify-center text-[10px] font-black text-slate-400 border border-slate-100">{index + 1}</div>
                                <span className="flex-1 text-xs font-medium text-slate-600 pt-1 leading-relaxed">{question}</span>
                                <button type="button" onClick={() => removeCustomQuestion(index)} className="text-slate-300 hover:text-red-500 transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default InterviewContextStep
