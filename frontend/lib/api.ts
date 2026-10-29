const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface PredictResponse {
  model_name: string;
  inference_ms: number;
  threshold: number;
  water_pixel_percentage: number;
  mean_uncertainty: number | null;
  overlay_png_base64: string;
  mask_png_base64: string;
  uncertainty_png_base64: string | null;
  gradcam_png_base64: string | null;
  image_size: [number, number];
}

export interface CompareResponse {
  before_water_percentage: number;
  after_water_percentage: number;
  delta_percentage_points: number;
  before_overlay_png_base64: string;
  after_overlay_png_base64: string;
  change_mask_png_base64: string;
  alignment_success: boolean;
  notes: string;
}

export interface ModelMetricData {
  model_name: string;
  timestamp: string;
  optimal_threshold: number;
  mean_latency_ms: number;
  fps: number;
  sample_count: number;
  metrics: {
    iou: number;
    dice: number;
    precision: number;
    recall: number;
    accuracy: number;
  };
  confusion_matrix: {
    tp: number;
    fp: number;
    fn: number;
    tn: number;
  };
}

export interface RobustnessData {
  model_name: string;
  timestamp: string;
  baseline: {
    iou: number;
    dice: number;
  };
  corruptions: {
    [corruption: string]: {
      [severity: string]: {
        iou: number;
        dice: number;
        precision: number;
        recall: number;
        dice_drop: number;
        dice_retention_pct: number;
      };
    };
  };
}

export interface OnnxBenchmarkData {
  model_name: string;
  img_size: number;
  runs: number;
  pytorch_cpu_ms: {
    mean: number;
    std: number;
    min: number;
    max: number;
  };
  onnxruntime_cpu_ms: {
    mean: number;
    std: number;
    min: number;
    max: number;
  };
  speedup_factor: number;
  max_abs_diff: number;
  onnx_model_path: string;
}

export interface MetricsResponse {
  models: Record<string, ModelMetricData>;
  robustness: Record<string, RobustnessData>;
  onnx: OnnxBenchmarkData | null;
}

export interface SampleItem {
  name: string;
  url: string;
  id?: string;
  water_percentage?: number;
  mean_uncertainty?: number;
}

export async function predictImage(
  file: File | Blob,
  fileName = "upload.jpg",
  explain = true,
  uncertainty = true,
  useOnnx = false
): Promise<PredictResponse> {
  const formData = new FormData();
  formData.append("file", file, fileName);

  const params = new URLSearchParams({
    explain: String(explain),
    uncertainty: String(uncertainty),
    use_onnx: String(useOnnx),
  });

  const res = await fetch(`${API_BASE}/predict?${params.toString()}`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Inference failed (${res.status}): ${errorText}`);
  }

  return res.json();
}

export async function compareImages(
  beforeFile: File | Blob,
  afterFile: File | Blob,
  beforeName = "before.jpg",
  afterName = "after.jpg"
): Promise<CompareResponse> {
  const formData = new FormData();
  formData.append("before", beforeFile, beforeName);
  formData.append("after", afterFile, afterName);

  const res = await fetch(`${API_BASE}/compare`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Comparison failed (${res.status}): ${errorText}`);
  }

  return res.json();
}

export async function downloadReport(
  file: File | Blob,
  fileName = "upload.jpg",
  explain = true,
  uncertainty = true
): Promise<Blob> {
  const formData = new FormData();
  formData.append("file", file, fileName);

  const params = new URLSearchParams({
    explain: String(explain),
    uncertainty: String(uncertainty),
  });

  const res = await fetch(`${API_BASE}/report?${params.toString()}`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Report generation failed (${res.status}): ${errorText}`);
  }

  return res.blob();
}

export async function fetchMetrics(): Promise<MetricsResponse> {
  const res = await fetch(`${API_BASE}/metrics`);
  if (!res.ok) {
    throw new Error(`Failed to fetch metrics: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchSamples(): Promise<SampleItem[]> {
  try {
    const res = await fetch(`${API_BASE}/samples`);
    if (res.ok) {
      const data = await res.json();
      if (data.samples && data.samples.length > 0) {
        return data.samples;
      }
    }
  } catch (err) {
    console.warn("Could not fetch samples from API, attempting local fallback:", err);
  }

  // Fallback to static samples.json if backend is not running
  try {
    const staticRes = await fetch("/samples/samples.json");
    if (staticRes.ok) {
      const staticData = await staticRes.json();
      return staticData.map((item: any) => ({
        name: item.filename,
        url: item.url,
        id: item.id,
        water_percentage: item.water_percentage,
        mean_uncertainty: item.mean_uncertainty,
      }));
    }
  } catch (err) {
    console.warn("Could not fetch static samples.json:", err);
  }

  return [];
}
