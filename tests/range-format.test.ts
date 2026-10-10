import {it,expect} from 'vitest';
import {formatValue} from '../apps/web/src/RangeField';

it('slider labels keep fine advanced-tier steps distinct',()=>{
 expect(formatValue(.025,'nm')).toBe('0.025nm');expect(formatValue(.035,'nm')).toBe('0.035nm');
 expect(formatValue(.007,'ms')).toBe('0.007ms');expect(formatValue(.002,'ms')).toBe('0.002ms');
 expect(formatValue(.8,'GHz')).toBe('0.8GHz');expect(formatValue(.25,'ns')).toBe('0.25ns');
 expect(formatValue(1.25,'GHz')).toBe('1.25GHz');expect(formatValue(16384,'コア')).toBe('16,384コア');
});
