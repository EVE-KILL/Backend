import fs from 'fs';
import { exec as childProcessExec } from 'child_process';
import util from 'util';
import { KillmailsESI } from '../server/models/KillmailsESI';

export default {
    name: "backfill:esikillmails",
    description: "Backfill all ESI Killmails from EVERef",
    longRunning: false,
    run: async ({ args }) => {
        await fetchESIKillmails();

        return { result: "Killmails backfilled" };
    },
};

async function fetchESIKillmails() {
    let earliestDate = new Date("2010-06-06");
    const currentDate = new Date();
    const daysSinceOldestDate = Math.floor(
        (currentDate.getTime() - earliestDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    for (let i = 0; i <= daysSinceOldestDate; i++) {
        const date = new Date(earliestDate);
        date.setDate(earliestDate.getDate() + i);
        const dateString = date.toISOString().split("T")[0];
        console.log(`Processing killmails for ${dateString}...`);
        await processDate(dateString);
    }
}

async function processDate(date: string) {
    const year = date.split("-")[0];
    const url = `https://data.everef.net/killmails/${year}/killmails-${date}.tar.bz2`;

    // Fetch the data
    const response = await fetch(url);
    if (!response.ok) {
        console.log(`No data available for ${date}`);
        return;
    }

    // Extract the .tar.bz2 to /tmp/killmails (Use the systems temp directory and bz2/tar to extract)
    const tmpDir = "/tmp/killmails";
    const tmpFile = `${tmpDir}/${date}.tar.bz2`;
    const tmpExtractDir = `${tmpDir}/${date}`;
    await fs.promises.mkdir(tmpDir, { recursive: true });
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await fs.promises.writeFile(tmpFile, buffer);
    await fs.promises.mkdir(tmpExtractDir, { recursive: true });
    const exec = util.promisify(childProcessExec);
    await exec(`tar -xf ${tmpFile} -C ${tmpExtractDir}`);

    // Read the files in the extracted directory
    const files = await fs.promises.readdir(tmpExtractDir);
    const filesPath = tmpDir + "/" + date + "/" + files[0];
    // Get a list of all files in the directory
    const killmailFiles = await fs.promises.readdir(filesPath);

    // Process each file
    for (const file of killmailFiles) {
        // Read the file
        const fileContents = await fs.promises.readFile(filesPath + "/" + file);
        // Parse the file
        const killmail = JSON.parse(fileContents.toString());
        // Save the killmail to the database
        let km = new KillmailsESI(killmail);
        try {
            await km.save();
        } catch (err) {
        }
    }

    // Cleanup
    await fs.promises.rm(tmpFile, { force: true });
    await fs.promises.rm(tmpExtractDir, { recursive: true, force: true });
}

