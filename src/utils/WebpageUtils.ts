export class WebpageUtils {
  public static calculateDevicePixelRatio(): number {
    return window.devicePixelRatio || 1;
  }
}