# Upload Artifact to S3

A drop-in replacement for [actions/upload-artifact](https://github.com/actions/upload-artifact) that uploads artifacts to S3-compatible storage instead of GitHub's built-in artifact storage.

## Why?

GitHub's artifact storage has limits that can be restrictive for large projects:
- 500 MB per artifact (10 GB with GitHub Enterprise)
- Limited retention periods
- Storage counts against your account limits

By using S3 (or S3-compatible storage like Garage, Cloudflare R2, MinIO, etc.), you get:
- Unlimited artifact sizes
- Flexible retention policies
- Lower costs for high-volume usage
- Cross-workflow and cross-repository artifact sharing

## Usage

### Basic

```yaml
- uses: kusold/action-upload-artifact-s3@v1
  with:
    name: my-artifact
    path: dist/
    s3-bucket: my-artifacts-bucket
  env:
    AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
    AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
```

### Multiple Files

```yaml
- uses: kusold/action-upload-artifact-s3@v1
  with:
    name: build-output
    path: |
      dist/
      build/output.zip
      !build/**/*.map
    s3-bucket: my-artifacts-bucket
    s3-region: us-west-2
  env:
    AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
    AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
```

### With S3-Compatible Storage (Garage)

```yaml
- uses: kusold/action-upload-artifact-s3@v1
  with:
    name: my-artifact
    path: dist/
    s3-bucket: my-bucket
    s3-endpoint: https://garage.example.com
    s3-region: garage
    s3-force-path-style: 'true'
  env:
    AWS_ACCESS_KEY_ID: ${{ secrets.GARAGE_ACCESS_KEY }}
    AWS_SECRET_ACCESS_KEY: ${{ secrets.GARAGE_SECRET_KEY }}
```

## Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `name` | Artifact name | No | `artifact` |
| `path` | Files to upload (glob patterns supported, multi-line) | **Yes** | - |
| `if-no-files-found` | Behavior when no files found: `warn`, `error`, `ignore` | No | `warn` |
| `retention-days` | Days to retain (stored as metadata) | No | - |
| `compression-level` | Gzip level 0-9 (0=none, 6=default, 9=max) | No | `6` |
| `overwrite` | Replace existing artifact with same name | No | `false` |
| `include-hidden-files` | Include hidden files in upload | No | `false` |
| `s3-bucket` | S3 bucket name | **Yes** | - |
| `s3-prefix` | Prefix path within the bucket | No | - |
| `s3-endpoint` | S3-compatible endpoint URL | No | - |
| `s3-region` | AWS region | No | `us-east-1` |
| `s3-force-path-style` | Use path-style URLs | No | `false` |

## Outputs

| Output | Description |
|--------|-------------|
| `artifact-id` | Unique identifier (S3 path) |
| `artifact-url` | S3 URL for the artifact |
| `artifact-digest` | SHA-256 digest of the artifact |

## S3-Compatible Storage

This action works with any S3-compatible storage:

| Provider | Endpoint | Path Style |
|----------|----------|------------|
| AWS S3 | (not needed) | `false` |
| [Garage](https://garagehq.deuxfleurs.fr) | Your Garage URL | `true` |
| Cloudflare R2 | `https://<ACCOUNT_ID>.r2.cloudflarestorage.com` | `false` |
| MinIO | Your MinIO URL | `true` |
| DigitalOcean Spaces | `https://<REGION>.digitaloceanspaces.com` | `false` |
| Backblaze B2 | `https://s3.<REGION>.backblazeb2.com` | `false` |

## S3 Path Structure

Artifacts are stored with the following structure:

```
s3://{bucket}/{prefix}/{owner}_{repo}/{run-id}/{attempt}/{artifact-name}/
├── _artifact_metadata.json
└── files/
    └── ... (your files, optionally gzip compressed)
```

## Comparison with actions/upload-artifact

| Feature | actions/upload-artifact | This Action |
|---------|------------------------|-------------|
| Storage | GitHub | S3-compatible |
| Max size | 500MB / 10GB | Unlimited |
| Retention | 90 days max | Configurable |
| Cross-repo | Limited | Yes |
| Cost | Included / Paid | S3 pricing |

## Related

- [kusold/action-download-artifact-s3](https://github.com/kusold/action-download-artifact-s3) - Download artifacts from S3
- [kusold/artifact-s3](https://github.com/kusold/artifact-s3) - Core library

## License

MIT
