import type {Screen} from './navigation';
const paths:Record<Screen,string>={
 company:'M3 21h18M6 21V5l6-2 6 2v16M9 9h1M14 9h1M9 13h1M14 13h1M11 21v-4h2v4',
 hardware:'M4 4h16v16H4zM8 8h8v8H8zM9 1v3M15 1v3M9 20v3M15 20v3M1 9h3M20 9h3M1 15h3M20 15h3',
 research:'M9 3h6M10 3v7L4 20a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1l-6-10V3M7 16h10',
 devices:'M3 4h18v12H3zM9 20h6M12 16v4M6 20h12',
 os:'M3 3h18v18H3zM3 9h18M9 9v12M13 13h5M13 17h3',
 management:'M4 20V8h16v12M2 20h20M8 8V4h8v4M7 12h2M15 12h2M7 16h2M15 16h2',
 ai:'M12 3v3M7 4l2 3M17 4l-2 3M6 13H3M21 13h-3M8 8a5 5 0 0 1 8 0c2 2 3 4 2 7l-3 3v3H9v-3l-3-3c-1-3 0-5 2-7ZM9 17h6',
 finance:'M4 20h16M6 17V9h3v8M11 17V4h3v13M16 17v-6h3v6',
 save:'M5 3h12l3 3v15H4V3h1ZM8 3v7h8V3M8 21v-7h8v7'
};
export function ScreenIcon({id}:{id:Screen}){return <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[id]}/></svg>;}
