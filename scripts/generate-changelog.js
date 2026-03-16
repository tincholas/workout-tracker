import fs from 'fs';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const changelogPath = path.join(__dirname, '../src/assets/changelog.json');
const packagePath = path.join(__dirname, '../package.json');

try {
    // 1. Get the current version
    const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    const version = pkg.version;

    // 2. Get the commit messages since the last "chore: bump version"
    // We get all commits, but stop when we see the automated bump commit from the PREVIOUS run.
    const logOutput = execSync('git log --format="%s"').toString().trim().split('\n');
    const changes = [];

    for (const msg of logOutput) {
        if (msg.startsWith('chore: bump version')) {
            break; // Stop at the last automated bump
        }

        // Filter out merges, typos, chore, etc. if you want, but for now let's just grab feat/fix
        // or just take everything that isn't a bump. Let's filter out 'chore:' completely.
        if (!msg.startsWith('chore:') && !msg.startsWith('Merge ')) {
            changes.push(msg);
        }
    }

    if (changes.length === 0) {
        console.log('No meaningful changes found for changelog. Skipping.');
        process.exit(0);
    }

    // 3. Read existing changelog or start empty
    let changelog = [];
    if (fs.existsSync(changelogPath)) {
        changelog = JSON.parse(fs.readFileSync(changelogPath, 'utf8'));
    }

    // Only add if this version isn't already the top entry (prevents duplicate runs polluting it)
    if (changelog.length === 0 || changelog[0].version !== version) {
        changelog.unshift({
            version: version,
            changes: changes
        });

        // 4. Save the new changelog
        fs.writeFileSync(changelogPath, JSON.stringify(changelog, null, 2));
        console.log(`Successfully added ${changes.length} changes for v${version} to changelog.json`);
    } else {
        console.log(`v${version} already exists in changelog.json. Skipping rewrite.`);
    }
} catch (error) {
    console.error('Failed to generate changelog:', error);
    process.exit(1);
}
