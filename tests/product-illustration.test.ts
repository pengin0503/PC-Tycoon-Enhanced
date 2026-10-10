import {afterEach,describe,expect,it,vi} from 'vitest';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {ProductIllustration,shade,storageForm} from '../apps/web/src/ProductIllustration';
import {hardwareKinds} from '../packages/content/src/research';

const kinds=[...hardwareKinds,'pc','laptop','os','ai-cluster','ai-model'];
const render=(kind:string,tier=0,color='graphite',spec={})=>renderToStaticMarkup(createElement(ProductIllustration,{kind,tier,color,spec}));

describe('product illustrations',()=>{
 afterEach(()=>vi.restoreAllMocks());
 it('renders every product kind at every grade without invalid geometry or React warnings',()=>{
  const error=vi.spyOn(console,'error');
  for(const kind of kinds)for(let tier=0;tier<=5;tier++)for(const color of ['graphite','silver','teal']){
   const svg=render(kind,tier,color,{cores:4,vram:.032,capacity:20,wattage:500,resolution:1080,speed:30,modular:'full',theme:'blue'});
   expect(svg).toMatch(/^<svg[^>]*viewBox="0 0 520 320"/);
   expect(svg,`${kind} grade ${tier} ${color}`).not.toMatch(/NaN|undefined|Infinity/);
  }
  expect(error).not.toHaveBeenCalled();
 });
 it('draws a distinct picture for each kind',()=>{
  const art=(svg:string)=>svg.replace(/<title>.*?<\/title>|aria-label="[^"]*"|<text[^>]*>[^<]*<\/text>/g,'');
  const pictures=new Set(kinds.map(kind=>art(render(kind))));
  expect(pictures.size).toBe(kinds.length);
 });
 it('shows storage as HDD, SATA SSD or M.2 NVMe from its transfer speed',()=>{
  expect(storageForm()).toBe('hdd');
  expect(storageForm({speed:250})).toBe('hdd');
  expect(storageForm({speed:500})).toBe('sata');
  expect(storageForm({speed:3000})).toBe('nvme');
  expect(render('storage',0,'graphite',{speed:500})).toContain('>SSD<');
 });
 it('prints the headline spec with the spec sheet units',()=>{
  expect(render('gpu',0,'graphite',{vram:.032})).toContain('VRAM 32MB');
  expect(render('cpu',0,'graphite',{cores:4})).toContain('4コア');
  expect(render('psu',0,'graphite',{wattage:500})).toContain('500W');
 });
 it('shades colours toward white and black',()=>{
  expect(shade('#808080',1)).toBe('#ffffff');
  expect(shade('#808080',-1)).toBe('#000000');
  expect(shade('#4d5f78',0)).toBe('#4d5f78');
 });
});
