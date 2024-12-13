import { getCharacter } from "../server/helpers/ESIData";

export default {
    name: 'test',
    description: 'Test command',
    longRunning: false,
    run: async ({ args }) => {
        let char = await getCharacter(268946627, true);
        console.log(char);

        return { response: 'Test command' };
    }
};
