/**
 * A simple pub/sub event bus for cross-component communication.
 */

type Listener = (...args: unknown[]) => void;

class EventBus {
  private events: { [key: string]: Listener[] } = {};

  /**
   * Subscribe to an event.
   * @param event The event name to listen for.
   * @param listener The callback function to execute.
   * @returns A function to unsubscribe the listener.
   */
  on(event: string, listener: Listener): () => void {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);
    // Return an unsubscribe function for cleanup
    return () => this.off(event, listener);
  }

  /**
   * Unsubscribe from an event.
   * @param event The event name.
   * @param listener The callback function to remove.
   */
  off(event: string, listener: Listener): void {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter(l => l !== listener);
  }

  /**
   * Publish an event to all subscribers.
   * @param event The event name to emit.
   * @param args The arguments to pass to the listeners.
   */
  emit(event: string, ...args: unknown[]): void {
    if (!this.events[event]) return;
    this.events[event].forEach(listener => {
      try {
        listener(...args);
      } catch (e) {
        console.error(`Error in event bus listener for '${event}':`, e);
      }
    });
  }
}

// Export a singleton instance
const eventBus = new EventBus();

export default eventBus;
