import React from 'react'
import { User, Building2, Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react'
import { EXPERIENCE_LEVEL_LABELS } from '../../../../constants'

const CandidateDetailsStep = ({ formData, handleInputChange, handleFileUpload, errors }) => {
    return (
        <div className="glass-card !p-8 rounded-3xl animate-fade-in">
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black text-slate-900 flex items-center">
                    <User className="w-6 h-6 mr-3 text-brand-600" />
                    Profile Intelligence
                </h2>
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-3 py-1 bg-slate-50 rounded-lg">Step 01 / 03</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Candidate Name</label>
                    <input
                        type="text"
                        value={formData.candidateInfo.name}
                        onChange={(e) => handleInputChange('candidateInfo', 'name', e.target.value)}
                        className={`input-premium ${errors['candidateInfo.name'] ? 'border-red-500 bg-red-50' : ''}`}
                        placeholder="e.g. Sultan Codes"
                    />
                    {errors['candidateInfo.name'] && (
                        <p className="mt-1.5 text-[10px] font-bold text-red-500 flex items-center uppercase ml-1">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            {errors['candidateInfo.name']}
                        </p>
                    )}
                </div>

                <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Target Role</label>
                    <input
                        type="text"
                        value={formData.candidateInfo.role}
                        onChange={(e) => handleInputChange('candidateInfo', 'role', e.target.value)}
                        className={`input-premium ${errors['candidateInfo.role'] ? 'border-red-500 bg-red-50' : ''}`}
                        placeholder="e.g. Senior Software Engineer"
                    />
                    {errors['candidateInfo.role'] && (
                        <p className="mt-1.5 text-[10px] font-bold text-red-500 flex items-center uppercase ml-1">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            {errors['candidateInfo.role']}
                        </p>
                    )}
                </div>

                <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Target Company</label>
                    <input
                        type="text"
                        value={formData.candidateInfo.company}
                        onChange={(e) => handleInputChange('candidateInfo', 'company', e.target.value)}
                        className={`input-premium ${errors['candidateInfo.company'] ? 'border-red-500 bg-red-50' : ''}`}
                        placeholder="e.g. Google, Microsoft"
                    />
                    {errors['candidateInfo.company'] && (
                        <p className="mt-1.5 text-[10px] font-bold text-red-500 flex items-center uppercase ml-1">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            {errors['candidateInfo.company']}
                        </p>
                    )}
                </div>

                <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Expertise Level</label>
                    <select
                        value={formData.candidateInfo.experience}
                        onChange={(e) => handleInputChange('candidateInfo', 'experience', e.target.value)}
                        className="input-premium appearance-none"
                    >
                        {Object.entries(EXPERIENCE_LEVEL_LABELS).map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-8">
                <FileUploadArea
                    label="Resume Analysis"
                    fileType="resume"
                    file={formData.candidateInfo.resume}
                    handleFileUpload={handleFileUpload}
                    handleRemoveFile={() => handleInputChange('candidateInfo', 'resume', null)}
                    icon={Upload}
                    accept=".pdf,.doc,.docx"
                />
                <FileUploadArea
                    label="Job Blueprint"
                    fileType="jobDescription"
                    file={formData.candidateInfo.jobDescription}
                    handleFileUpload={handleFileUpload}
                    handleRemoveFile={() => handleInputChange('candidateInfo', 'jobDescription', null)}
                    icon={FileText}
                    accept=".pdf,.doc,.docx,.txt"
                    accentColor="accent"
                />
            </div>
        </div>
    )
}

const FileUploadArea = ({ label, fileType, file, handleFileUpload, handleRemoveFile, icon: Icon, accept, accentColor = 'brand' }) => {
    return (
        <div className="group">
            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-3 ml-1">{label}</label>
            <div className={`relative aspect-[16/6] lg:aspect-[16/5] border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center bg-slate-50/50 hover:bg-white hover:border-${accentColor}-300 hover:shadow-premium transition-all cursor-pointer group-hover:scale-[1.01] overflow-hidden`}>
                <input
                    type="file"
                    accept={accept}
                    onChange={(e) => handleFileUpload(fileType, e.target.files[0])}
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                />
                {!file ? (
                    <div className="text-center p-6">
                        <div className="w-12 h-12 bg-white rounded-xl shadow-soft flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                            <Icon className={`w-6 h-6 text-${accentColor}-500`} />
                        </div>
                        <p className="text-xs font-black text-slate-900 uppercase tracking-tighter">Upload {label}</p>
                    </div>
                ) : (
                    <div className={`absolute inset-0 bg-${accentColor}-50/90 flex flex-col items-center justify-center p-4`}>
                        <CheckCircle className={`w-8 h-8 text-${accentColor}-600 mb-2 animate-bounce`} />
                        <p className={`text-xs font-black text-${accentColor}-700 truncate max-w-[80%]`}>{file.filename}</p>
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleRemoveFile(); }}
                            className="mt-3 text-[10px] font-black uppercase text-red-500 hover:text-red-600"
                        >Remove File</button>
                    </div>
                )}
            </div>
        </div>
    )
}

export default CandidateDetailsStep
