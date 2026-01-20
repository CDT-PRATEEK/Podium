import React from 'react'

export default function TopicGrid({ onTopicClick }) {
  const topics = [
    { id: 'TECH', label: 'Technology', desc: 'Code, AI, and Future.' },
    { id: 'PHIL', label: 'Philosophy', desc: 'Thinking about thinking.' },
    { id: 'SCI',  label: 'Science',    desc: 'Understanding the universe.' },
    { id: 'SOC',  label: 'Society',    desc: 'How we live together.' },
    { id: 'ART',  label: 'Art',        desc: 'Beauty and expression.' },
    { id: 'LIFE', label: 'Life',       desc: 'Growth and daily habits.' },
  ]

  // UNIVERSAL ICON SYSTEM (Same as Onboarding)
  const getTopicIcon = (id) => {
    switch(id) {
        case 'TECH': return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25m18 0A2.25 2.25 0 0 0 18.75 3H5.25A2.25 2.25 0 0 0 3 5.25m18 0V12a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 12V5.25" /></svg>;
        case 'PHIL': return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.854 1.591-2.16 1.115-.366 1.913-1.423 1.913-2.647 0-1.356-.91-2.527-2.223-2.863A4.48 4.48 0 0 0 13.5 10a4.48 4.48 0 0 0-4.5 3.5c-.34 1.336 1.63 1.63 1.63 2.5 0 1.356.91 2.527 2.223 2.863.367.094.74.143 1.115.143 1.357 0 2.528-.91 2.863-2.223Z" /></svg>;
        case 'SCI':  return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0 1 12 15a9.065 9.065 0 0 0-6.23-.693L5 14.5m14.8.8 1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0 1 12 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" /></svg>;
        case 'SOC':  return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" /></svg>;
        case 'ART':  return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.245c0-.399-.078-.78-.22-1.128Zm0 0a15.998 15.998 0 0 0 3.388-1.62m-5.043-.025a15.994 15.994 0 0 1 1.622-3.395m3.42 3.418a15.995 15.995 0 0 0 4.764-4.648l3.876-5.814a1.151 1.151 0 0 0-1.597-1.597L14.146 6.32a15.996 15.996 0 0 0-4.649 4.763m3.42 3.42a6.776 6.776 0 0 0-3.42-3.42" /></svg>;
        case 'LIFE': return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" /></svg>;
        default: return null;
    }
  }

  return (
    <div className="mb-10">
        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Browse by Topic</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {topics.map(topic => (
                <div 
                    key={topic.id}
                    onClick={() => onTopicClick(topic.id)} 
                    className="p-6 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-xl hover:shadow-lg hover:border-blue-400 dark:hover:border-blue-500 cursor-pointer transition-all duration-300 group flex flex-col items-center text-center gap-3"
                >
                    <div className="text-gray-400 dark:text-gray-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:scale-110 transition-transform mb-1">
                        {getTopicIcon(topic.id)}
                    </div>
                    <div>
                        <div className="font-bold text-gray-800 dark:text-white">{topic.label}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{topic.desc}</div>
                    </div>
                </div>
            ))}
        </div>
    </div>
  )
}