use base64::Engine;
use image::GenericImageView;

pub fn is_identical(img_a_base64: &str, img_b_base64: &str) -> bool {
    let decode = |b64: &str| -> Option<image::DynamicImage> {
        // Hapus prefix "data:image/png;base64," jika ada
        let data = b64.split(',').last().unwrap_or(b64);
        
        let bytes = base64::engine::general_purpose::STANDARD
            .decode(data)
            .ok()?;
        
        image::load_from_memory(&bytes).ok()
    };

    let img_a = match decode(img_a_base64) {
        Some(img) => img,
        None => return false,
    };

    let img_b = match decode(img_b_base64) {
        Some(img) => img,
        None => return false,
    };

    if img_a.dimensions() != img_b.dimensions() {
        return false;
    }

    img_a.pixels().zip(img_b.pixels()).all(|(p1, p2)| p1 == p2)
}