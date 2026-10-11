import {it,expect} from 'vitest';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {PriceEditor} from '../apps/web/src/ProductEditors';
import {createGame,command} from '../packages/sim/src';
import {withTestStaff} from './staff-fixture';
import {defaultSpec} from '../packages/content/src/hardware';
import {evaluateHardware} from '../packages/sim/src/hardware';
import {priceRange} from '../packages/sim/src/pricing';
import {marketReference} from '../packages/sim/src/market';
it.each([2000,2030,2100,2200])('price UI and engine accept the same endpoints in %i',year=>{
 let s=withTestStaff(createGame({id:'price',name:'Price',seed:42,difficulty:'normal'}),false);
 s.day=(year-2000)*360;s.year=year;s.research.completed=['cpu-compute-1'];s.company.cash=1e12;
 const spec=defaultSpec('cpu'),metrics=evaluateHardware('cpu',spec,s.research.completed),range=priceRange({kind:'cpu',...metrics},marketReference('cpu',s.day));
 s=command(s,{type:'design',kind:'cpu',name:'CPU',spec,price:range.min});
 for(const price of [range.min,range.max])expect(()=>command(s,{type:'price',id:'p-1',price})).not.toThrow();
 const html=renderToStaticMarkup(createElement(PriceEditor,{product:s.products[0],state:s,send:()=>{}} as any));
 expect(html).toContain(`max="${range.max}"`);expect(html).toContain(`min="${range.min}"`);
});
