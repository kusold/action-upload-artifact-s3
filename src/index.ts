import * as core from "@actions/core";
import * as path from "path";
import {
  uploadArtifact,
  S3Config,
  GitHubContext,
  NoFilesFoundBehavior,
} from "@kusold/artifact-s3";

async function run(): Promise<void> {
  try {
    // Get inputs
    const name = core.getInput("name") || "artifact";
    const inputPath = core.getInput("path", { required: true });
    const ifNoFilesFound =
      (core.getInput("if-no-files-found") as NoFilesFoundBehavior) || "warn";
    const retentionDays = parseInt(core.getInput("retention-days") || "0", 10);
    const compressionLevel = parseInt(
      core.getInput("compression-level") || "6",
      10,
    );
    const overwrite = core.getInput("overwrite") === "true";
    const includeHiddenFiles = core.getInput("include-hidden-files") === "true";

    // S3-specific inputs
    const s3Bucket = core.getInput("s3-bucket", { required: true });
    const s3Prefix = core.getInput("s3-prefix") || undefined;
    const s3Endpoint = core.getInput("s3-endpoint") || undefined;
    const s3Region = core.getInput("s3-region") || "us-east-1";
    const s3ForcePathStyle = core.getInput("s3-force-path-style") === "true";

    // Build S3 config
    const s3Config: S3Config = {
      bucket: s3Bucket,
      prefix: s3Prefix,
      endpoint: s3Endpoint,
      region: s3Region,
      forcePathStyle: s3ForcePathStyle || !!s3Endpoint,
    };

    // Build GitHub context
    const context: GitHubContext = {
      repository: process.env.GITHUB_REPOSITORY || "unknown/unknown",
      runId: parseInt(process.env.GITHUB_RUN_ID || "0", 10),
      runAttempt: parseInt(process.env.GITHUB_RUN_ATTEMPT || "1", 10),
    };

    // Determine root directory
    const workspace = process.env.GITHUB_WORKSPACE || process.cwd();
    const rootDirectory = path.resolve(workspace);

    // Parse paths (can be multiline)
    const paths = inputPath
      .split("\n")
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    core.info(`Artifact name: ${name}`);
    core.info(`Paths: ${paths.join(", ")}`);
    core.info(`S3 bucket: ${s3Bucket}`);
    if (s3Prefix) {
      core.info(`S3 prefix: ${s3Prefix}`);
    }
    if (s3Endpoint) {
      core.info(`S3 endpoint: ${s3Endpoint}`);
    }

    try {
      const result = await uploadArtifact(s3Config, context, {
        name,
        paths,
        rootDirectory,
        retentionDays: retentionDays || undefined,
        compressionLevel,
        overwrite,
        includeHiddenFiles,
      });

      core.setOutput("artifact-id", result.id);
      core.setOutput("artifact-url", result.url);
      core.setOutput("artifact-digest", result.digest);

      core.info("");
      core.info("Artifact upload complete!");
      core.info(`  ID: ${result.id}`);
      core.info(`  URL: ${result.url}`);
      core.info(`  Digest: ${result.digest}`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      // Check if this is a "no files found" error
      if (errorMessage.includes("No files found")) {
        switch (ifNoFilesFound) {
          case "warn":
            core.warning(
              `No files were found with the provided path: ${inputPath}. No artifacts will be uploaded.`,
            );
            return;
          case "ignore":
            core.info(
              `No files were found with the provided path: ${inputPath}. No artifacts will be uploaded.`,
            );
            return;
          case "error":
          default:
            core.setFailed(
              `No files were found with the provided path: ${inputPath}. No artifacts will be uploaded.`,
            );
            return;
        }
      }

      throw error;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    core.setFailed(errorMessage);
  }
}

run();
