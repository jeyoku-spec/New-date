
import React, { useState } from 'react';
import type { AnalysisResult, ChatSession } from '../types';
import { translateText } from '../services/geminiService';
import { CopyIcon, CheckIcon, TranslateIcon } from './icons';

const ReplyCard: React.FC<{ item: { title: string; reply: string }, sessionLanguage?: ChatSession['language'] }> = ({ item, sessionLanguage }) => {
    const [copied, setCopied] = useState(false);
    const [translation, setTranslation] = useState<string | null>(null);
    const [isTranslating, setIsTranslating] = useState(false);

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const handleTranslate = async (text: string) => {
        setIsTranslating(true);
        const result = await translateText(text);
        setTranslation(result || "Could not retrieve translation.");
        setIsTranslating(false);
    };

    return (
        <div className="bg-gray-800 rounded-lg p-5 shadow-lg border border-gray-700">
            <h4 className="text-lg font-bold bg-gradient-to-r from-green-400 to-cyan-500 text-transparent bg-clip-text mb-3">{item.title}</h4>
            
            <div className="relative">
                <p className="text-gray-200 bg-gray-900 p-4 pr-12 rounded-md whitespace-pre-wrap">
                    {item.reply}
                </p>
                <button 
                    onClick={() => handleCopy(item.reply)} 
                    aria-label="Copy reply"
                    className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors p-1 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                    {copied ? <CheckIcon className="h-5 w-5 text-green-400"/> : <CopyIcon className="h-5 w-5"/>}
                </button>
            </div>
            
            {sessionLanguage === 'es' && (
                <div className="mt-3">
                    {translation ? (
                        <div className="bg-gray-900 p-3 rounded-md border-l-2 border-purple-400">
                            <p className="text-sm font-semibold text-purple-300">Translation:</p>
                            <p className="text-gray-300 italic">{translation}</p>
                        </div>
                    ) : (
                         <button 
                            onClick={() => handleTranslate(item.reply)}
                            disabled={isTranslating}
                            className="flex items-center gap-2 text-sm text-purple-300 hover:text-purple-200 disabled:opacity-50 transition-colors"
                        >
                            {isTranslating ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-200"></div>
                                    <span>Translating...</span>
                                </>
                            ) : (
                                <>
                                    <TranslateIcon className="h-4 w-4" />
                                    <span>Translate</span>
                                </>
                            )}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

interface AnalysisDisplayProps {
  result: AnalysisResult;
  uploadedImage: string | null;
  onAnalyzeNext: () => void;
  onBack: () => void;
  session: ChatSession | null;
}

export const AnalysisDisplay: React.FC<AnalysisDisplayProps> = ({ result, uploadedImage, onAnalyzeNext, onBack, session }) => {
  return (
    <div className="space-y-8">
        <div className="flex justify-between items-center flex-wrap gap-4">
            <h2 className="text-2xl md:text-3xl font-bold text-white">Your Replies are Ready!</h2>
            <div className="flex items-center gap-2">
                 <button 
                    onClick={onBack}
                    className="px-4 py-2 border border-gray-600 text-gray-300 rounded-md hover:bg-gray-700 transition-colors text-sm"
                >
                    &larr; Back to Chats
                </button>
                <button 
                    onClick={onAnalyzeNext}
                    className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors font-semibold"
                >
                    Analyze Next Screenshot
                </button>
            </div>
        </div>
        
        {uploadedImage && <img src={uploadedImage} alt="Uploaded conversation" className="rounded-lg max-h-96 mx-auto w-auto object-contain" />}
      
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-purple-300">Conversation Summary:</h3>
        <p className="text-gray-300 mt-1">{result.summary}</p>
        {result.shortcutsUsed && (
            <div className="mt-4 pt-4 border-t border-gray-700">
                <h4 className="text-sm font-semibold text-gray-400">Shortcuts Used:</h4>
                <p className="text-sm text-gray-300 mt-1">{result.shortcutsUsed}</p>
            </div>
        )}
      </div>

      <div className="space-y-6">
        <h3 className="text-2xl font-bold text-white">💬 Ready-to-Send Replies</h3>
        {result.replies.map((item, i) => <ReplyCard key={i} item={item} sessionLanguage={session?.language} />)}
      </div>
    </div>
  );
};