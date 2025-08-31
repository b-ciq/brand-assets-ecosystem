# CIQ Brand Assets

## Directory Structure

```
/assets/
  /ciq/
    /logos/           # CIQ company logos
  /fuzzball/
    /logos/           # Fuzzball product logos
  /warewulf/          # Future: Warewulf logos
  /apptainer/         # Future: Apptainer logos
```

## Adding New Assets

1. **Add files** to appropriate `/assets/{product}/{type}/` directory
2. **Run metadata generator**: `python generate_metadata.py`  
3. **Commit changes** - metadata will be auto-updated

## Naming Conventions

**CIQ:** `CIQ-Logo-{variant}-{background}.{ext}`  
**Fuzzball:** `Fuzzball-{Type}_{color}_{size}.{ext}`

See `/metadata/asset-inventory.json` for complete asset catalog.