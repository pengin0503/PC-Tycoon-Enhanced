import type {Screen} from './navigation';
const paths:Record<Screen,string>={
 home:'M3 11l9-7 9 7M5 10v10h14V10M9 20v-6h6v6',
 develop:'M14 4l6 6-9 9H5v-6zM12 6l6 6M4 20h16',
 products:'M3 7l9-4 9 4-9 4zM3 7v10l9 4 9-4V7M12 11v10',
 research:'M9 3h6M10 3v7L4 20a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1l-6-10V3M7 16h10',
 upgrades:'M12 3l7 7h-4v6H9v-6H5zM6 20h12',
 staff:'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21v-1a7 7 0 0 1 14 0v1M17 11a3 3 0 1 0 0-6M22 21v-1a5 5 0 0 0-4-5',
 companies:'M4 20V8h16v12M2 20h20M8 8V4h8v4M7 12h2M15 12h2M7 16h2M15 16h2',
 ai:'M12 3v3M7 4l2 3M17 4l-2 3M6 13H3M21 13h-3M8 8a5 5 0 0 1 8 0c2 2 3 4 2 7l-3 3v3H9v-3l-3-3c-1-3 0-5 2-7ZM9 17h6',
 stats:'M4 20h16M6 17V9h3v8M11 17V4h3v13M16 17v-6h3v6',
 settings:'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z'
};
export function ScreenIcon({id,size=20}:{id:Screen,size?:number}){return <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[id]}/></svg>;}
