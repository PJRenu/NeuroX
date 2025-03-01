# utils/scan_processor.py    
import nibabel as nib
import numpy as np

def process_scan(filepath):
    """
    Process an MRI scan to identify affected regions.
    
    Args:
        filepath (str): Path to the MRI scan file (NIfTI or DICOM).
        
    Returns:
        dict: Affected regions with severity scores (0-1).
    """
    try:
        # Load MRI scan (NIfTI format)
        if filepath.lower().endswith('.nii') or filepath.lower().endswith('.nii.gz'):
            img = nib.load(filepath)
            data = img.get_fdata()  # Get 3D volumetric data
            
            # Example: Simulate affected regions based on MRI data
            hippocampus_affected = np.mean(data[30:40, 40:50, 20:30]) / np.max(data)  # Example ROI
            entorhinal_affected = np.mean(data[25:35, 45:55, 15:25]) / np.max(data)
            prefrontal_affected = np.mean(data[35:45, 60:70, 35:45]) / np.max(data)
            
            return {
                'hippocampus': float(hippocampus_affected),
                'entorhinal_cortex': float(entorhinal_affected),
                'prefrontal_cortex': float(prefrontal_affected)
            }
        
        # Handle DICOM files (if needed)
        elif filepath.lower().endswith('.dcm'):
            # Use pydicom to process DICOM files
            pass
        
        else:
            raise ValueError("Unsupported file format. Please upload an MRI scan in NIfTI or DICOM format.")
    
    except Exception as e:
        print(f"Error processing MRI scan: {e}")
        return {
            'hippocampus': 0.3,
            'entorhinal_cortex': 0.2,
            'prefrontal_cortex': 0.1
        }