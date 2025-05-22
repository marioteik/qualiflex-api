import "socket.io"; // Import the existing definitions

declare module "socket.io" {
  interface Socket {
    user?: {
      userId: string;
      phone?: string;
    };
  }
}
