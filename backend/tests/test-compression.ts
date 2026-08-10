import { ReflectionEngine } from '../src/core/ReflectionEngine';

async function test() {
    await ReflectionEngine.runCompressionCycle();
    console.log('Compression Cycle Complete');
}

test();
