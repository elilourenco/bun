import { Queue, Worker } from "bullmq";

import IORedis from "ioredis"

const connection = new IORedis({

    host: process.env.REDIS_HOST ||  "localhost",
    port: parseInt(process.env.REDIS_HOST || "6379")
});


 export const mediaQueue = new Queue('media-processing', { 
    connection ,
    defaultJobOptions:{
        attempts:3,
        backoff:{
            type: "exponential",
            delay: 1000,

        }
    }
});
export function createMediaWorker(){
    return   new  Worker ("media-processing", async(job) =>{
        const {mediaId, postId,mediaUrl} = job.data;
         console.log(`processando midia ${mediaId} do post ${postId}`);

         return {success: true , mediaId};



    }, {connection})
} 