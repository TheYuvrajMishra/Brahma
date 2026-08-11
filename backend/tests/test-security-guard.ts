import { SecurityGuard } from '../src/core/SecurityGuard';
import { SkillRegistry } from '../src/core/SkillRegistry';
import { Executor } from '../src/pipeline/Executor';
import { Composer } from '../src/pipeline/Composer';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function runTests() {
    console.log('🧪 Starting Security Guard & Privacy Shield Test Suite...\n');
    let passed = 0;
    let total = 0;

    function assert(condition: boolean, description: string) {
        total++;
        if (condition) {
            console.log(`✅ [PASS] ${description}`);
            passed++;
        } else {
            console.error(`❌ [FAIL] ${description}`);
        }
    }

    // Test 1: Direct deletion tool blockage
    const res1 = SecurityGuard.validateToolCall('delete-email', { id: '123' });
    assert(!res1.isSafe && res1.violationType === 'DELETION_ATTEMPT', 'SecurityGuard blocks forbidden tool delete-email');

    // Test 2: Destructive action parameter blockage
    const res2 = SecurityGuard.validateToolCall('batch-update-spreadsheet', { action: 'delete_row', spreadsheetId: 'abc' });
    assert(!res2.isSafe && res2.violationType === 'DELETION_ATTEMPT', 'SecurityGuard blocks destructive action parameter');

    // Test 3: Secret exposure blockage
    const res3 = SecurityGuard.validateToolCall('some-tool', { encryptedAccessToken: 'raw-secret-token' });
    assert(!res3.isSafe && res3.violationType === 'PRIVACY_BREACH', 'SecurityGuard blocks credential/token exposure');

    // Test 4: User prompt deletion intent inspection
    const res4 = SecurityGuard.inspectPromptIntent('Please delete all my emails from yesterday');
    assert(!res4.isSafe && res4.violationType === 'DELETION_ATTEMPT', 'SecurityGuard detects prompt deletion intent for emails');

    const res5 = SecurityGuard.inspectPromptIntent('Remove my Google sheet document right now');
    assert(!res5.isSafe && res5.violationType === 'DELETION_ATTEMPT', 'SecurityGuard detects prompt deletion intent for sheets/drive');

    // Test 5: Safe tool call validation
    const res6 = SecurityGuard.validateToolCall('get-emails', { max_results: 5 });
    assert(res6.isSafe === true, 'SecurityGuard allows safe get-emails tool call');

    // Test 6: SkillRegistry execution interception
    try {
        await SkillRegistry.runSkill('delete-file', { fileId: 'xyz' });
        assert(false, 'SkillRegistry should throw on forbidden deletion skill');
    } catch (err: any) {
        assert(err.message.includes('Security Enforcement Violation'), 'SkillRegistry throws Security Enforcement Error on deletion attempt');
    }

    // Test 7: Executor pre-check blocking forbidden plan step
    const badPlan = [
        {
            step: 1,
            action: 'delete_user_email',
            tool: 'delete-email',
            params: { id: 'msg_99' },
            depends_on: []
        }
    ];

    const dummyMsg = {
        message_id: 'test_msg_1',
        platform: 'cli',
        channel_id: 'test_chan',
        user_id: 'test_user',
        content: 'delete my email',
        timestamp: new Date()
    };

    const execResults = await Executor.execute(badPlan, dummyMsg as any);
    assert(execResults[0].status === 'failed' && execResults[0].output.includes('[SECURITY GUARD BLOCKED]'), 'Executor blocks forbidden deletion step');

    // Test 8: Security footer appending in Composer output
    const rawOutput = "Here is your requested response.";
    const footerOutput = SecurityGuard.appendSecurityFooter(rawOutput);
    assert(footerOutput.includes('🔒 **Brahma Security Guarantee**'), 'SecurityGuard appends security badge to response');

    // Test 9: Security prompt inspection for bulk deletion attempts
    const res7 = SecurityGuard.inspectPromptIntent('delete all my gmail inbox emails');
    assert(!res7.isSafe && res7.violationType === 'DELETION_ATTEMPT', 'SecurityGuard inspects and blocks bulk deletion prompt intent');

    console.log(`\n📊 Test Summary: ${passed}/${total} assertions passed.`);
    if (passed === total) {
        console.log('🎉 All Security Guard tests passed successfully!');
        process.exit(0);
    } else {
        process.exit(1);
    }
}

runTests();
