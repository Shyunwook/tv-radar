import { createLogger, format, transports } from 'winston';
import winstonDaily from 'winston-daily-rotate-file';
import moment from 'moment'

function formatParams(info) {
    const { timestamp, level, message, ...args } = info;
    let ts = timestamp.slice(0, 19).replace("T", " ");
    ts = moment(ts, "YYYY-MM-DD HH:mm:ss").add(9, 'hours');
    return `${ts} ${level} : ${message} ${Object.keys(args).length? JSON.stringify(args, "", "") : ""}`
}

const log_format = format.combine(
    format.colorize(),
    format.timestamp(),
    format.align(),
    format.printf(formatParams)
)

let logger;

logger = createLogger({
    format : log_format,
    transports : [
        new transports.Console({
            level : 'debug'
        }),
        new winstonDaily({
            level : 'info',
            filename : `logs/app-%DATE%.log`,
            datePattern: 'YYYY-MM-DD',
            zippedArchive : true,
            maxSize : '20m',
            maxFiles : '14d'
        }),
        new winstonDaily({
            name : 'exception-file',
            level: 'error',
            filename : `logs/error-%DATE%.log`,
            datePattern: 'YYYY-MM-DD',
            zippedArchive : true,
            maxSize : '20m',
            maxFiles : '14d'
        })
    ]
})

logger.stream = {
    write: (message, encoding) => {
        logger.info(message);
    }
};

module.exports = logger;