
import React, { useState, useCallback, useEffect } from 'react';
import { ImageUploader } from './components/ImageUploader';
import { AnalysisDisplay } from './components/AnalysisDisplay';
import { Loader } from './components/Loader';
import { analyzeConversation } from './services/geminiService';
import * as historyService from './services/historyService';
import type { AnalysisResult, ChatSession } from './types';
import { parseAnalysis } from './utils';
import { Translator } from './components/Translator';
import { LocationMarkerIcon } from './components/icons';
import { ugandaDistricts } from './ugandaDistricts';

const Header: React.FC<{ view: 'coach' | 'translator', setView: (view: 'coach' | 'translator') => void }> = ({ view, setView }) => {
  const commonButtonClasses = "px-4 py-2 rounded-md font-semibold transition-colors";
  const activeButtonClasses = "bg-purple-600 text-white";
  const inactiveButtonClasses = "bg-gray-700 text-gray-300 hover:bg-gray-600";
  
  return (
    <header className="text-center p-4 md:p-6 border-b border-gray-700">
      <h1 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 text-transparent bg-clip-text">
        Dating Coach AI
      </h1>
      <p className="text-gray-400 mt-2 text-sm md:text-base max-w-2xl mx-auto">
        Your personal AI to analyze chats and help you win hearts.
      </p>
      <nav className="mt-6 flex justify-center gap-4">
        <button 
          onClick={() => setView('coach')}
          className={`${commonButtonClasses} ${view === 'coach' ? activeButtonClasses : inactiveButtonClasses}`}
          aria-current={view === 'coach'}
        >
          Dating Coach
        </button>
        <button 
          onClick={() => setView('translator')}
          className={`${commonButtonClasses} ${view === 'translator' ? activeButtonClasses : inactiveButtonClasses}`}
          aria-current={view === 'translator'}
        >
          Translator
        </button>
      </nav>
    </header>
  );
};

const BossModeToggle: React.FC<{ isBossMode: boolean; onToggle: () => void, disabled?: boolean }> = ({ isBossMode, onToggle, disabled }) => (
  <button
    onClick={onToggle}
    disabled={disabled}
    aria-pressed={isBossMode}
    className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
      isBossMode 
      ? 'bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-lg' 
      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
    }`}
  >
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 2a2 2 0 00-2 2v1H6a2 2 0 00-2 2v7a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2V4a2 2 0 00-2-2zm-1 3V4a1 1 0 112 0v1h-2z" clipRule="evenodd" />
    </svg>
    <span>{isBossMode ? 'Boss Mode: ON' : 'Boss Mode'}</span>
  </button>
);

const App: React.FC = () => {
  const [view, setView] = useState<'coach' | 'translator'>('coach');
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [latestAnalysis, setLatestAnalysis] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [outfitSent, setOutfitSent] = useState<boolean>(false);
  const [isAskingLocation, setIsAskingLocation] = useState<boolean>(false);
  const [isAskingGoal, setIsAskingGoal] = useState<boolean>(false);
  const [isAskingJob, setIsAskingJob] = useState<boolean>(false);
  const [isAskingIdealMan, setIsAskingIdealMan] = useState<boolean>(false);
  const [isAskingChildren, setIsAskingChildren] = useState<boolean>(false);

  useEffect(() => {
    let allSessions = historyService.getSessions();
    const lillySessionExists = allSessions.some(s => s.contactName === 'Lilly');
    const melRosSessionExists = allSessions.some(s => s.contactName === 'Mel Ros');

    if (!lillySessionExists) {
      const lillySession: ChatSession = {
        id: `lilly-${Date.now()}`,
        contactName: 'Lilly',
        history: [],
        isBossMode: false,
        goal: 'getNumber',
        personalContext: "This is a new crush I want to get to know better.",
        language: 'en',
        location: 'Kampala',
      };
      historyService.saveSession(lillySession);
      allSessions = historyService.getSessions();
    }

    if (!melRosSessionExists) {
      const melRosSession: ChatSession = {
        id: `melros-${Date.now()}`,
        contactName: 'Mel Ros',
        history: [],
        isBossMode: false,
        goal: 'rapport',
        personalContext: "This is a new crush who speaks Spanish. Please provide all replies in natural, casual Spanish.",
        language: 'es',
        location: 'Mukono',
      };
      historyService.saveSession(melRosSession);
      allSessions = historyService.getSessions();
    }
    
    setSessions(allSessions);

  }, []);

  const currentSession = sessions.find(s => s.id === currentSessionId) || null;

  const handleAnalyze = useCallback(async (imageBase64: string, imageFile: File) => {
    if (!currentSession) return;
    setIsLoading(true);
    setError(null);
    setLatestAnalysis(null);
    setUploadedImage(URL.createObjectURL(imageFile));

    try {
      const resultText = await analyzeConversation(
        imageBase64, 
        imageFile.type, 
        currentSession.isBossMode,
        currentSession.goal,
        outfitSent, 
        isAskingLocation,
        isAskingGoal,
        isAskingJob,
        isAskingIdealMan,
        isAskingChildren,
        currentSession.history,
        currentSession.personalContext,
        currentSession.location
      );
      if (resultText) {
        const parsedData = parseAnalysis(resultText);
        setLatestAnalysis(parsedData);
        
        const updatedSession = { ...currentSession };
        if (currentSession.contactName === 'New Chat' && parsedData.detectedName !== 'Unknown') {
          updatedSession.contactName = parsedData.detectedName;
        }
        updatedSession.history.push(parsedData.summary);
        historyService.saveSession(updatedSession);
        setSessions(historyService.getSessions());

      } else {
        setError("The analysis returned an empty result. Please try again.");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to analyze the conversation. Please check your image or try again later.");
    } finally {
      setIsLoading(false);
    }
  }, [currentSession, outfitSent, isAskingLocation, isAskingGoal, isAskingJob, isAskingIdealMan, isAskingChildren]);

  const handleNewChat = (isBossMode: boolean, goal: ChatSession['goal'], location: string) => {
    const isFirstEverSession = sessions.length === 0;
    const newSession: ChatSession = {
      id: Date.now().toString(),
      contactName: 'New Chat',
      history: [],
      isBossMode: isBossMode,
      goal: goal,
      personalContext: isFirstEverSession ? "I have not spent with a girl in the house for a week" : "",
      language: 'en',
      location: location,
    };
    historyService.saveSession(newSession);
    setSessions(historyService.getSessions());
    setCurrentSessionId(newSession.id);
  };
  
  const handleSelectSession = (id: string) => {
    setCurrentSessionId(id);
    setLatestAnalysis(null);
    setUploadedImage(null);
    setError(null);
  };
  
  const handleDeleteSession = (id: string) => {
      if (window.confirm("Are you sure you want to delete this conversation?")) {
        historyService.deleteSession(id);
        const remainingSessions = historyService.getSessions();
        setSessions(remainingSessions);
        if (currentSessionId === id) {
            setCurrentSessionId(null);
        }
      }
  };

  const resetToHome = () => {
    setCurrentSessionId(null);
    setLatestAnalysis(null);
    setUploadedImage(null);
    setError(null);
  };

  const analyzeNextInSession = () => {
    setLatestAnalysis(null);
    setUploadedImage(null);
    setError(null);
  };


  const SessionListView = () => {
    const [isBossModeForNew, setIsBossModeForNew] = useState(false);
    const [goalForNew, setGoalForNew] = useState<ChatSession['goal']>('rapport');
    const [locationForNew, setLocationForNew] = useState('Mukono');

    return (
        <div className="max-w-2xl mx-auto">
            <div className="bg-gray-800 rounded-lg p-6 shadow-xl mb-8">
                <h2 className="text-2xl font-bold text-white mb-4">Start a New Chat</h2>
                 <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-400 mb-2">Set a Goal:</label>
                    <div className="flex rounded-md shadow-sm">
                        <button 
                            type="button"
                            onClick={() => setGoalForNew('rapport')} 
                            className={`px-4 py-2 text-sm font-medium transition-colors rounded-l-md w-1/2 ${goalForNew === 'rapport' ? 'bg-purple-600 text-white z-10 ring-1 ring-purple-500' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                        >
                            Build Rapport
                        </button>
                        <button 
                            type="button"
                            onClick={() => setGoalForNew('getNumber')} 
                            className={`px-4 py-2 text-sm font-medium transition-colors rounded-r-md w-1/2 -ml-px ${goalForNew === 'getNumber' ? 'bg-purple-600 text-white z-10 ring-1 ring-purple-500' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                        >
                            Get Number
                        </button>
                    </div>
                </div>

                <div className="mb-4">
                    <label htmlFor="location-select" className="block text-sm font-medium text-gray-400 mb-2">Your District:</label>
                    <select
                        id="location-select"
                        className="w-full bg-gray-700 text-gray-200 rounded-md p-2 border border-gray-600 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                        value={locationForNew}
                        onChange={(e) => setLocationForNew(e.target.value)}
                    >
                        {ugandaDistricts.map(district => (
                            <option key={district} value={district}>
                                {district}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex items-center gap-4 mt-6">
                    <button onClick={() => handleNewChat(isBossModeForNew, goalForNew, locationForNew)} className="flex-grow px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-md hover:opacity-90 transition-opacity shadow-lg">
                        + New Conversation
                    </button>
                    <BossModeToggle isBossMode={isBossModeForNew} onToggle={() => setIsBossModeForNew(!isBossModeForNew)} />
                </div>
            </div>

            <h2 className="text-2xl font-bold text-white mb-4">Your Conversations</h2>
            <div className="space-y-4">
                {sessions.length > 0 ? sessions.map(session => (
                    <div key={session.id} className="bg-gray-800 rounded-lg p-4 flex justify-between items-center shadow-lg transition-transform hover:scale-105">
                        <button onClick={() => handleSelectSession(session.id)} className="text-left flex-grow">
                            <h3 className="font-bold text-lg text-white">{session.contactName} {session.isBossMode && '💼'} {session.language === 'es' && '🇪🇸'}</h3>
                             <div className="flex items-center gap-2 text-sm text-gray-400">
                                <LocationMarkerIcon className="h-4 w-4" />
                                <span>{session.location || 'Not set'} &middot; {session.history.length} screenshots</span>
                            </div>
                            {session.goal === 'getNumber' && <p className="text-xs text-cyan-400 font-semibold mt-1">Goal: Get Number</p>}
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteSession(session.id); }} className="p-2 text-gray-500 hover:text-red-400">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg>
                        </button>
                    </div>
                )) : <p className="text-center text-gray-500 py-8">No conversations yet. Start a new one!</p>}
            </div>
        </div>
    );
  };

  const ChatView = () => {
    const [isContextEditorOpen, setIsContextEditorOpen] = useState(false);
    const [contextInput, setContextInput] = useState(currentSession?.personalContext || '');
    const [isLocationEditorOpen, setIsLocationEditorOpen] = useState(false);
    const [locationInput, setLocationInput] = useState(currentSession?.location || 'Mukono');

    useEffect(() => {
        setContextInput(currentSession?.personalContext || '');
        setLocationInput(currentSession?.location || 'Mukono');
    }, [currentSession?.id, currentSession?.personalContext, currentSession?.location]);

    const handleSaveContext = () => {
        if (!currentSession) return;
        const updatedSession = { ...currentSession, personalContext: contextInput };
        historyService.saveSession(updatedSession);
        setSessions(historyService.getSessions());
        setIsContextEditorOpen(false);
    };

     const handleSaveLocation = () => {
        if (!currentSession) return;
        const updatedSession = { ...currentSession, location: locationInput };
        historyService.saveSession(updatedSession);
        setSessions(historyService.getSessions());
        setIsLocationEditorOpen(false);
    };

    return (
      <div className="max-w-4xl mx-auto">
          {isLoading ? (
              <Loader />
          ) : latestAnalysis ? (
              <AnalysisDisplay result={latestAnalysis} uploadedImage={uploadedImage} onAnalyzeNext={analyzeNextInSession} onBack={resetToHome} session={currentSession} />
          ) : (
              <>
                  <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                      <button onClick={resetToHome} className="flex items-center gap-2 px-4 py-2 border border-gray-600 text-gray-300 rounded-md hover:bg-gray-700 transition-colors">
                          &larr; <span>Back to Chats</span>
                      </button>
                      <div className="text-right">
                          <h2 className="text-xl font-bold text-white">{currentSession?.contactName}</h2>
                          <div className="flex items-center justify-end gap-3 text-sm text-gray-400 mt-1">
                               <button onClick={() => setIsLocationEditorOpen(!isLocationEditorOpen)} className="flex items-center gap-1 hover:text-white">
                                    <LocationMarkerIcon className="h-4 w-4" />
                                    <span>{currentSession?.location || 'Set Location'}</span>
                               </button>
                               <span>&middot;</span>
                               <button onClick={() => setIsContextEditorOpen(!isContextEditorOpen)} title="Edit Personal Context" className="hover:text-white">
                                    Edit Context
                                </button>
                          </div>
                          {currentSession?.isBossMode && <p className="text-sm font-semibold text-red-400 mt-1">Boss Mode</p>}
                          {currentSession?.goal === 'getNumber' && <p className="text-sm font-semibold text-cyan-400 mt-1">Goal: Get Number</p>}
                      </div>
                  </div>
                  
                  {isLocationEditorOpen && (
                    <div className="bg-gray-800 rounded-lg p-4 mb-6 border border-gray-700 shadow-lg">
                      <h3 className="text-lg font-semibold text-purple-300 mb-2">My District</h3>
                       <select
                          className="w-full bg-gray-900 text-gray-200 rounded-md p-2 border border-gray-600 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                          value={locationInput}
                          onChange={(e) => setLocationInput(e.target.value)}
                      >
                          {ugandaDistricts.map(district => (
                              <option key={district} value={district}>
                                  {district}
                              </option>
                          ))}
                      </select>
                      <div className="text-right mt-3">
                        <button onClick={handleSaveLocation} className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors font-semibold text-sm">
                          Save Location
                        </button>
                      </div>
                    </div>
                  )}

                  {isContextEditorOpen && !isLocationEditorOpen && (
                    <div className="bg-gray-800 rounded-lg p-4 mb-6 border border-gray-700 shadow-lg">
                      <h3 className="text-lg font-semibold text-purple-300 mb-2">My Personal Context</h3>
                      <p className="text-sm text-gray-400 mb-3">Add any personal details here. I'll use this to give you more tailored advice.</p>
                      <textarea
                          value={contextInput}
                          onChange={(e) => setContextInput(e.target.value)}
                          className="w-full bg-gray-900 text-gray-200 rounded-md p-2 border border-gray-600 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                          rows={3}
                          placeholder="e.g., I'm feeling a bit tired this week, looking for something low-effort..."
                      />
                      <div className="text-right mt-3">
                        <button onClick={handleSaveContext} className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors font-semibold text-sm">
                          Save Context
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-center items-center gap-4 mb-6 flex-wrap">
                        <button
                          onClick={() => setIsAskingLocation(!isAskingLocation)}
                          aria-pressed={isAskingLocation}
                          className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 ${
                              isAskingLocation 
                              ? 'bg-gradient-to-r from-cyan-400 to-sky-500 text-white shadow-lg' 
                              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          }`}
                        >
                            <LocationMarkerIcon className="h-5 w-5" />
                            <span>{isAskingLocation ? 'Asking Location' : 'Ask Location?'}</span>
                        </button>
                       <button
                          onClick={() => setIsAskingGoal(!isAskingGoal)}
                          aria-pressed={isAskingGoal}
                          className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 ${
                              isAskingGoal 
                              ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-lg' 
                              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          }`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            <span>{isAskingGoal ? 'Asking Goal' : 'What are you looking for?'}</span>
                        </button>
                        <button
                          onClick={() => setIsAskingJob(!isAskingJob)}
                          aria-pressed={isAskingJob}
                          className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 ${
                              isAskingJob 
                              ? 'bg-gradient-to-r from-orange-400 to-red-500 text-white shadow-lg' 
                              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          }`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                                <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z" />
                            </svg>
                            <span>{isAskingJob ? 'Asking Job' : 'Ask Job?'}</span>
                        </button>
                        <button
                          onClick={() => setIsAskingIdealMan(!isAskingIdealMan)}
                          aria-pressed={isAskingIdealMan}
                          className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 ${
                              isAskingIdealMan 
                              ? 'bg-gradient-to-r from-pink-400 to-rose-500 text-white shadow-lg' 
                              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          }`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                            </svg>
                            <span>{isAskingIdealMan ? 'Asking Ideal Man' : 'Ask Ideal Man?'}</span>
                        </button>
                        <button
                          onClick={() => setIsAskingChildren(!isAskingChildren)}
                          aria-pressed={isAskingChildren}
                          className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 ${
                              isAskingChildren 
                              ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-white shadow-lg' 
                              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          }`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                            </svg>
                            <span>{isAskingChildren ? 'Asking Children' : 'Ask Children?'}</span>
                        </button>
                       <button
                          onClick={() => setOutfitSent(!outfitSent)}
                          aria-pressed={outfitSent}
                          className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 ${
                              outfitSent 
                              ? 'bg-gradient-to-r from-teal-400 to-blue-500 text-white shadow-lg' 
                              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          }`}
                          >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M17.707 3.293a1 1 0 00-1.414 0L9 10.586 4.707 6.293a1 1 0 00-1.414 1.414l5 5a1 1 0 001.414 0l9-9a1 1 0 000-1.414z" />
                          </svg>
                          <span>{outfitSent ? 'Outfit Sent' : 'Outfit Sent?'}</span>
                      </button>
                  </div>
                  <ImageUploader onAnalyze={handleAnalyze} error={error} />
              </>
          )}
      </div>
    )
  };

  const CoachView = () => (
    currentSessionId ? <ChatView /> : <SessionListView />
  );

  return (
    <div className="min-h-screen bg-gray-900 font-sans">
      <Header view={view} setView={setView} />
      <main className="container mx-auto p-4 md:p-8">
        {view === 'coach' ? <CoachView /> : <Translator />}
      </main>
      <footer className="text-center p-4 mt-8 text-gray-500 text-sm">
        <p>Powered by Gemini. Built for educational and entertainment purposes.</p>
      </footer>
    </div>
  );
};

export default App;
