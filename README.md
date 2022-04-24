# loadbalancer

University project for visualization of threads load balancing.

Imaginary files are generated at random time intervals with random sizes and added to the queue. Five working threads are responsible for upload files from the queue. Load balancing algorithm chooses the next file to upload based on a number that is calculated based on file size and time in queue.
Small files and the longest waiting are the first to being uploaded

App is written in Node.JS, Electron
