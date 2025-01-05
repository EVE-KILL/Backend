import { nitroApp } from "nitropack/runtime/internal/app";

export default defineNitroPlugin(() => {

    nitroApp.hooks.hook('request', (event) => {
        let requestIp = getRequestIP(event, { xForwardedFor: true });

        console.log(event.context.clientAddress,
            event.node.req.connection.remoteAddress,
            event.node.req.socket.remoteAddress,
            getRequestIP(event),
            getRequestIP(event, { xForwardedFor: true }));

        // Output request log info similar to nginx
        console.log(`[${new Date().toISOString()} "${event.node.req.method} ${event.node.req.url} HTTP/${event.node.req.httpVersion}" ${event.node.req.headers['user-agent']} ${requestIp}`);
    });
});
