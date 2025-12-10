import React from 'react';
import { SpecialtyId } from '../types';
import { SPECIALTY_DOSSIERS } from '../content/gameData';
import { CheckIcon } from './icons';

interface JobDossierProps {
    specialtyId: SpecialtyId;
    language: 'en' | 'ar';
    onContinue: () => void;
}

const JobDossier: React.FC<JobDossierProps> = ({ specialtyId, language, onContinue }) => {
    const data = SPECIALTY_DOSSIERS[specialtyId][language];
    const isAr = language === 'ar';

    return (
        <div className="flex flex-col h-full w-full max-w-2xl mx-auto p-4 animate-fade-in font-mono" dir={isAr ? 'rtl' : 'ltr'}>
            
            {/* Header / Top Secret Stamp */}
            <div className="border-b-2 border-green-500/50 pb-4 mb-6 flex justify-between items-center">
                <div>
                    <h2 className="text-xs text-green-600 tracking-[0.2em] mb-1">
                        {isAr ? 'ملف سري للغاية' : 'TOP SECRET // CLASSIFIED'}
                    </h2>
                    <h1 className="text-2xl md:text-3xl font-bold text-white uppercase tracking-wider">
                        {data.title}
                    </h1>
                </div>
                <div className="border-2 border-green-500 rounded px-2 py-1 transform rotate-[-12deg] opacity-80">
                    <span className="text-green-500 font-bold text-sm">
                        {isAr ? 'تم الوصول' : 'AUTHORIZED'}
                    </span>
                </div>
            </div>

            {/* Main Content Card */}
            <div className="flex-1 bg-black/40 border border-green-500/30 rounded-lg p-6 overflow-y-auto shadow-[0_0_30px_rgba(0,255,0,0.1)]">
                
                {/* Role Definition */}
                <div className="mb-8">
                    <h3 className="text-green-400 text-sm font-bold mb-2 uppercase border-l-2 border-green-500 pl-3">
                        {isAr ? '>> تعريف المهمة' : '>> MISSION DEFINITION'}
                    </h3>
                    <p className="text-gray-200 text-lg leading-relaxed">
                        {data.role_definition}
                    </p>
                </div>

                {/* Tactical Capabilities */}
                <div className="mb-8">
                    <h3 className="text-green-400 text-sm font-bold mb-4 uppercase border-l-2 border-green-500 pl-3">
                        {isAr ? '>> القدرات التكتيكية' : '>> TACTICAL CAPABILITIES'}
                    </h3>
                    <ul className="space-y-3">
                        {data.tactics.map((tactic, idx) => (
                            <li key={idx} className="flex items-start gap-3 text-gray-300">
                                <span className="mt-1 text-green-500"><CheckIcon /></span>
                                <span>{tactic}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Market Intelligence */}
                <div className="bg-green-900/10 p-4 rounded border border-green-500/20">
                    <h3 className="text-gray-400 text-xs font-bold mb-1 uppercase">
                        {isAr ? 'بيانات السوق' : 'MARKET INTEL'}
                    </h3>
                    <p className={`font-bold ${data.market_color} text-lg`}>
                        {data.market_status}
                    </p>
                </div>
            </div>

            {/* Footer Action */}
            <div className="mt-6 flex justify-center">
                <button 
                    onClick={onContinue}
                    className="bg-green-600 hover:bg-green-500 text-black font-bold py-3 px-12 rounded shadow-[0_0_15px_rgba(0,255,0,0.4)] transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                >
                    {isAr ? 'استمرار المهمة' : 'CONTINUE MISSION'}
                    <span className="animate-pulse">_</span>
                </button>
            </div>
        </div>
    );
};

export default JobDossier;