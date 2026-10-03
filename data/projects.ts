export type Project = {
  name: string;
  description: string;
  liveUrl?: string;
  githubUrl?: string;
  stack: string[];
};

export const projects: Project[] = [
  {
    name: "kivo",
    description: "realtime chat platform",
    liveUrl: "https://kivo-drab.vercel.app/",
    githubUrl: "https://github.com/lungtav/kivo",
    stack: ["react", "typeScript", "node.js", "socket.io"],
  },
  {
    name: "rally",
    description: "gym facility booking system",
    githubUrl: "https://github.com/lungtav/rally",
    stack: ["react", "typeScript", "postgreSQL"],
  },
];
