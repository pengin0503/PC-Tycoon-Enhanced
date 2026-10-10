/**
 * CPU sockets. A socket fixes how much power it can deliver to a CPU and how many memory channels it wires out; a new
 * CPU design must stay within its socket, and a PC needs a CPU and motherboard of the same socket.
 *
 * Industry sockets are open platforms that appear on the calendar (`year`) and are free for every company to use.
 * Rivals and generic suppliers build on the mainstream one of their era (`mainstream`, the year it becomes the
 * mainstream platform); each covers the power and memory channels of the era's mainstream CPU until its successor
 * arrives. After the `cpu-socket-1` research a company can develop its own sockets, up to what its CPU research allows
 * (cooling for power, memory channels for channels), to build CPUs beyond the current industry platform.
 */
export type SocketSpec={name:string,power:number,channels:number};
export type IndustrySocket=SocketSpec&{year:number,mainstream:number};
export const industrySockets:readonly IndustrySocket[]=[
 {name:'Atlas',power:120,channels:2,year:2000,mainstream:2000},
 {name:'Nova',power:180,channels:4,year:2000,mainstream:2022},
 {name:'Orion',power:250,channels:8,year:2045,mainstream:2049},
 {name:'Lyra',power:400,channels:16,year:2080,mainstream:2084},
 {name:'Polaris',power:800,channels:32,year:2100,mainstream:2105},
 {name:'Sirius',power:1200,channels:64,year:2165,mainstream:2168},
];
/** Industry sockets released by calendar `year`. */
export const industrySocketsAt=(year:number)=>industrySockets.filter(x=>x.year<=year);
/** The industry socket rivals and suppliers build on in calendar `year`. */
export const mainstreamSocket=(year:number)=>industrySockets.filter(x=>x.mainstream<=year).at(-1)!;
export const isIndustrySocket=(name:string)=>industrySockets.some(x=>x.name===name);
/** Research that unlocks socket development. */
export const socketResearch='cpu-socket-1';
/**
 * `designCost` (yen) is the cost of a socket matching Atlas; it grows with `(power/120)^powerExponent ×
 * (channels/2)^channelExponent`, rounded to ¥1M. Motherboards of a company socket pay `boardPowerCost` per W and
 * `boardChannelCost` per channel above Atlas for the stronger power delivery and wiring (a low-volume platform;
 * industry sockets are mass-produced and add nothing).
 */
export const socketBalance={designCost:100000000,powerExponent:.3,channelExponent:.2,work:20,maxSockets:30,nameLength:24,minPower:50,
 boardPowerCost:10,boardChannelCost:300,reference:industrySockets[0]} as const;
/** Power steps a socket can be designed for (W). */
export const socketPowerSteps=[50,60,80,100,120,150,180,200,250,300,350,400,500,600,700,800,1000,1200,1500,2000];
/** Pin count shown for a socket: a rough function of power delivery and memory wiring. */
export const socketPins=(s:Pick<SocketSpec,'power'|'channels'>)=>Math.round((150+s.power*2+s.channels*100)/10)*10;
/** Development cost of a socket. */
export function socketDesignCost(s:Pick<SocketSpec,'power'|'channels'>){
 const b=socketBalance,r=b.reference;
 return Math.max(1000000,Math.round(b.designCost*(s.power/r.power)**b.powerExponent*(s.channels/r.channels)**b.channelExponent/1000000)*1000000);
}
/** Extra unit cost of a motherboard built for a company socket stronger than Atlas. */
export function socketBoardCost(s:Pick<SocketSpec,'power'|'channels'>){
 const b=socketBalance,r=b.reference;
 return Math.max(0,s.power-r.power)*b.boardPowerCost+Math.max(0,s.channels-r.channels)*b.boardChannelCost;
}
