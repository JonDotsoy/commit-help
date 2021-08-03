export class Capture {
  partialPos: number | null = null;
  isUse: boolean = false;
  lastPos: [number, number] | null = null;
  start(pos: number) {
    if (this.isUse) throw new Error("The capture only can be used once");
    this.isUse = true;
    this.partialPos = pos;
  }
  stop(pos: number) {
    if (!this.isUse) throw new Error("The capture only can be used once");
    if (!this.partialPos) throw new Error("The capture must be started before");
    this.lastPos = [this.partialPos, pos];
    this.isUse = false;
    this.partialPos = null;
  }
}
