# Datasets for the v2 models

Checked on 2026-11-22 against the live sources (Hugging Face Hub API and datasets-server, GitHub API, Zenodo API).
Image counts are the **raw** configurations only. Pre-augmented copies that some mirrors also publish are never used, because they leak into the test set.

## Rules

- **Allowed licenses:** CC0, CC BY, CC BY-SA, MIT, Apache-2.0. CC BY-NC is allowed because this is a non-commercial student competition entry.
- **Rejected:** ND (no-derivatives) licenses and sources with no license stated, unless the original publisher states one (noted below).
- **Minimum class size:** **150 unique images** after perceptual-hash deduplication, and at least **20** of them in the test split. Smaller classes are dropped automatically by the notebook and listed in its report.
- **Exception:** wheat uses a minimum of **100** (`MIN_IMAGES_BY_CROP`). Its only free field set has 122 healthy and 128 brown rust images, and dropping them would leave wheat without a healthy class. Treat wheat accuracy as the least reliable.
- **Cap:** at most **3,000 images per (source, class)** before sampling, so huge sets (coffee 58k, potato 55k, bean 59k) cannot drown out the rest.
- **Setting:** `field` = real conditions (natural background, sunlight, clutter). `lab` = single leaf or fruit on a plain background. `mixed` = both, or not documented. Only `field` sources count toward the real-world test score.

Mirror URLs are `https://huggingface.co/datasets/<id>` unless a full URL is given.

## Classification sources (used)

| Crop | Part | Source (id) | License | Classes (raw label → used condition) | Raw images | Setting |
|---|---|---|---|---|---|---|
| 14 crops | leaf | PlantVillage, github.com/spMohanty/PlantVillage-Dataset | CC BY-SA 3.0 (per Zenodo record 1204914; the GitHub repo has no license file) | 38 classes (apple scab … tomato healthy) | 54,305 | lab |
| 13 crops | leaf | PlantDoc object detection, github.com/pratikkayal/PlantDoc-Object-Detection-Dataset | CC BY 4.0 | 27 leaf classes, cropped from boxes | 2,569 photos (~8,400 boxes) | field |
| rice | leaf, panicle, stem | `Project-AgML/paddy_disease_classification` (Paddy Doctor) | Mirror lists none. CC BY per the original IEEE DataPort record (doi 10.21227/hz4v-af08, also listed in OpenAlex) | bacterial_leaf_blight, bacterial_leaf_streak, bacterial_panicle_blight, blast, brown_spot, dead_heart, downy_mildew, hispa, healthy, tungro | 10,407 | field |
| rice | leaf | `Project-AgML/rice_leaf_disease_classification_india` | CC BY 4.0 | bacterial_leaf_blight, blast, brown_spot, tungro | 5,932 | mixed |
| rice | leaf | `Project-AgML/rice_disease_classification_bangladesh` (raw) | CC BY 4.0 | healthy, leaf_scald, blast, leaffolder, stripe_virus, tungro ("Insect" and "Rice" dropped as ambiguous) | 2,769 | field |
| rice | leaf | `Project-AgML/rice_leaf_bacterial_fungal` (raw) | CC BY 4.0 | bacterial_leaf_blight, brown_spot, healthy, blast, leaf_scald, narrow_brown_spot, hispa, sheath_blight | 1,701 | field |
| rice | leaf | `Project-AgML/Dhan-Shomadhan_rice_leaf_disease_classification` | CC BY 4.0 | brown_spot, leaf_scald, blast, tungro, sheath_blight (misspelled labels merged) | 1,106 | mixed |
| wheat | leaf | Zenodo 7573133, "Wheat disease images (small dataset)", John Innes Centre | CC BY 4.0 | yellow_rust, brown_rust, septoria, powdery_mildew, healthy | 999 | field |
| maize | leaf | `Project-AgML/maize_disease_classification` | CC BY 4.0 | healthy, lethal_necrosis (MLN), streak_virus (MSV) | 9,356 | field |
| maize, cassava, tomato, cashew | leaf, stem | `Project-AgML/crop_pest_disease_classification` (CCMT, raw) | CC BY 4.0 | 18 labels × 4 crops (ambiguous "leaf blight"/"leaf spot" on tomato and maize are dropped) | 25,170 | field |
| maize, onion, tomato | leaf, fruit | `Project-AgML/TOM2024_disease_classification` (raw) | CC BY 4.0 | 24 labels; crop-specific mapping, rare combinations dropped by the 150 minimum | 12,082 | field |
| maize | leaf | `Project-AgML/corn_leaf_disease_classification` | CC BY 4.0 | 6 labels | 600 | field |
| sugarcane | leaf, stem | `Project-AgML/sugarcane_leaf_disease_classification` | CC BY 4.0 | banded_chlorosis, brown_spot, brown_rust, grassy_shoot, healthy, pokkah_boeng, sett_rot, smut, viral_disease, yellow_leaf ("Dried" dropped) | 6,748 | field |
| cotton | leaf | `Project-AgML/cotton_leaf_disease_classification_bangladesh_2` (raw) | CC BY 4.0 | bacterial_blight, leaf_curl_virus, healthy, herbicide_damage, jassids, leaf_reddening, variegation | 2,137 | field |
| cotton | leaf | `Project-AgML/cotton_leaf_disease_classification` (raw) | CC BY-NC 4.0 | alternaria_leaf_spot, bacterial_blight, fusarium_wilt, healthy, verticillium_wilt | 1,373 | field |
| soybean | leaf | `Project-AgML/MH_SoyaHealthVision_disease_classification_leaf` | CC BY 4.0 | semilooper, frogeye_leaf_spot, healthy, mosaic_virus, rust, septoria_brown_spot | 2,782 | field |
| soybean | leaf | `Project-AgML/soybean_leaf_disease_classification` | CC BY 4.0 | bacterial_blight, healthy, septoria_brown_spot, vein_necrosis ("Dry_leaf" and "Root_images" dropped) | 1,176 | field |
| potato | leaf | `Project-AgML/potato_leaf_blight` | CC BY 4.0 | early_blight, healthy, late_blight | 55,453 | mixed |
| potato | leaf | `Project-AgML/potato_leaf_disease_classification` | CC BY 4.0 | late_blight (Phytophthora), healthy, viral_disease (Bacteria/Fungi/Pest/Nematode dropped as too generic) | 3,076 | field |
| potato | tuber | `Project-AgML/potato_disease_classification` | CC BY 4.0 | blackspot_bruising, dry_rot, healthy, soft_rot (other tuber classes are under 150) | 3,905 | lab |
| tomato | fruit | `Project-AgML/tomato_quality_classification` (raw) | CC BY 4.0 | healthy, rotten | 1,986 | mixed |
| tomato, 11 tree/field crops | leaf | `Project-AgML/plantcity_leaf_disease_classification` (raw) | CC BY 4.0 | 52 labels (apple, apricot, bean, cherry, corn, fig, grape, loquat, pear, persimmon, tomato, walnut) | 10,667 | field |
| pepper (chili) | leaf | `Project-AgML/COLD_chili_leaf_disease_classification` (raw) | CC BY 4.0 | cercospora_leaf_spot, healthy, mites_thrips, nutrient_deficiency, powdery_mildew | 532 | field |
| pepper (chili) | leaf | `Project-AgML/chili_pepper_virus_classification` | CC BY 4.0 | healthy, broad_bean_wilt_virus ("flood_stress" dropped) | 4,102 | mixed |
| pepper, tomato | fruit | `Project-AgML/VegNet_quality_classification` | CC BY 4.0 | damaged, healthy (ripe and unripe merged into healthy; old and dried dropped) | 6,150 | lab |
| eggplant | leaf | `Project-AgML/eggplant_disease_classification` (raw) | CC BY 4.0 | healthy, insect_damage, leaf_spot, mosaic_virus (white mold and wilt are under 150) | 4,089 | field |
| eggplant | leaf, fruit | `Project-AgML/eggplant_leaf_disease_classification` (raw) | CC BY-NC 4.0 | aphids, cercospora_leaf_spot, flea_beetle, phytophthora_blight, powdery_mildew, mosaic_virus, healthy leaf/fruit, damaged fruit | 3,116 | field |
| eggplant | fruit | `Project-AgML/BrinjalFruitX_disease_classification` | CC BY 4.0 | fruit_cracking, healthy, phomopsis_blight, fruit_borer, wet_rot | 1,823 | field |
| cucumber, gourds, cauliflower, eggplant, tomato | leaf | `Project-AgML/plant_leaf_disease_classification` | CC BY 4.0 | 16 labels × 6 crops (downy_mildew, anthracnose, mosaic_virus, black_rot …) | 12,786 | field |
| watermelon | leaf | `Project-AgML/watermelon_disease_classification` (raw) | CC BY 4.0 | anthracnose, downy_mildew, healthy, mosaic_virus | 1,155 | field |
| cauliflower | head, leaf | `Project-AgML/VegNet_cauliflower_disease_classification` (raw) | CC BY 4.0 | bacterial_spot_rot, black_rot, downy_mildew, healthy | 656 | field |
| cauliflower | leaf | `Project-AgML/cauliflower_leaf_disease_classification` | CC BY 4.0 | black_rot, healthy, insect_damage | 2,661 | field |
| onion | leaf | `Project-AgML/COLD_onion_leaf_disease_classification` (raw) | CC BY 4.0 | iris_yellow_spot_virus, stemphylium_blight, healthy (purple blotch has only 18) | 815 | field |
| bean | leaf | `Project-AgML/bean_disease_uganda` (iBeans) | CC BY 4.0 | angular_leaf_spot, rust, healthy | 1,295 | field |
| bean | leaf | `Project-AgML/bean_disease_classification_tanzania` | CC BY 4.0 | anthracnose, healthy, rust | 59,071 | field |
| bean, cowpea | leaf | `Project-AgML/bean_cowpea_leaf_disease_classification` | CC BY 4.0 | bacterial_wilt, blight, healthy, mosaic_virus, rust, septoria_leaf_spot | 4,467 | field |
| apple | leaf | `Project-AgML/appleleaf9_disease_classification` | CC BY 4.0 | alternaria_leaf_spot, brown_spot, frogeye_leaf_spot, grey_spot, healthy, mosaic, powdery_mildew, rust, scab | 14,582 | field |
| apple | leaf | `Project-AgML/apple_leaf_disease_classification` | CC BY 4.0 | alternaria_leaf_spot, mosaic, healthy | 5,612 | field |
| apple | leaf | `timm/plant-pathology-2021` (Plant Pathology 2021, FGVC8) | Apache-2.0 (as stated on the mirror) | healthy, scab, frogeye_leaf_spot, rust, powdery_mildew (single-label images only; "complex" dropped) | 18,632 | field |
| grape | leaf | `Project-AgML/gvlid_grapevine_leaf_disease` | CC BY 4.0 | black_rot, esca, healthy, leaf_blight | 3,477 | field |
| grape | leaf | `Project-AgML/grape_leaf_disease_classification` | CC BY 4.0 | bacterial_leaf_spot, downy_mildew, healthy, powdery_mildew | 2,726 | mixed |
| citrus | leaf | `Project-AgML/lemon_leaf_disease_classification` (raw) | CC BY 4.0 | anthracnose, bacterial_blight, canker, leaf_curl_virus, nutrient_deficiency, healthy, sooty_mould, spider_mites ("Dry Leaf" dropped) | 1,354 | field |
| citrus | leaf, fruit | `Project-AgML/citrus_fruit_leaf_disease_classification` | CC BY 4.0 | black_spot, canker, greening, healthy (melanose and scab are under 150) | 759 | field |
| banana | leaf, plant | `Project-AgML/banana_disease_classification_tanzania` | CC0 | sigatoka (black sigatoka), fusarium_wilt, healthy | 16,092 | field |
| banana | leaf | `Project-AgML/BananaLSD_leaf_disease_classification` (raw) | CC BY 4.0 | cordana, healthy, pestalotiopsis, sigatoka | 937 | field |
| banana | leaf | `Project-AgML/banana_leaf_disease_classification` | CC BY 4.0 | healthy, sigatoka, xanthomonas_wilt | 1,288 | field |
| mango | leaf | `Project-AgML/MangoLeafBD_disease_classification` | CC BY-NC 3.0 | anthracnose, bacterial_canker, cutting_weevil, die_back, gall_midge, healthy, powdery_mildew, sooty_mould | 4,000 | field |
| coffee | leaf | `Project-AgML/arabica_coffee_leaf_disease_classification` | CC BY 4.0 | cercospora_leaf_spot, healthy, leaf_rust, leaf_miner, phoma | 58,549 | field |
| tea | leaf | `Project-AgML/teaLeafBD_disease_classification` | CC BY 4.0 | brown_blight, gray_blight, green_mirid_bug, healthy, helopeltis, red_spider_mite, algal_leaf_spot | 5,278 | field |
| tea | leaf | `Project-AgML/tea_leaf_disease_classification_bangladesh_2` | CC BY 4.0 | healthy, helopeltis, red_rust ("Blight" dropped as ambiguous) | 2,500 | field |
| groundnut | leaf | `Project-AgML/groundnut_leaf_disease_classification` | CC BY 4.0 | alternaria_leaf_spot, healthy, leaf_spot, rust (rosette is under 150) | 1,720 | field |
| guava | leaf, fruit | `Project-AgML/guava_disease_classification` (raw) | CC BY 4.0 | anthracnose, canker, dot, healthy, rust, styler_end_rot | 3,049 | field |
| papaya | leaf | `Project-AgML/papaya_leaf_disease_classification_bangladesh` (raw) | CC BY 4.0 | healthy, leaf_curl, mealybug, mite, mosaic, ring_spot | 1,400 | field |
| pomegranate | fruit | `Project-AgML/pomegranate_disease_classification_india` | CC BY 4.0 | alternaria, anthracnose, bacterial_blight, cercospora, healthy | 5,099 | field |
| okra | leaf | `Project-AgML/OkraDiseaseNet_disease_classification` | CC BY 4.0 | 6 labels | 1,495 | field |
| sunflower | leaf | `Project-AgML/sunflower_disease_classification` | CC BY 4.0 | downy_mildew, healthy, gray_mold, leaf_scars | 2,358 | field |
| lentil | leaf | `Project-AgML/lentil_disease_classification` | CC BY 4.0 | ascochyta_blight, rust, healthy, powdery_mildew | 5,349 | field |
| 8 fruits | fruit | `Project-AgML/fresh_rotten_fruit_classification` (raw) | CC BY 4.0 | apple, banana, grape, guava, jujube, orange, pomegranate, strawberry × fresh/rotten | 3,200 | lab |
| 7 fruits | fruit | `Project-AgML/FruitNet_quality_classification` | CC BY 4.0 | apple, banana, guava, lemon, lime, orange, pomegranate × good/bad ("Mixed" dropped) | 19,526 | mixed |
| ~70 fruits and vegetables | fruit | Fruits-360, `PedroSampaio/fruits-360` (original github.com/Horea94/Fruit-Images-Dataset) | MIT | crop identity only, mapped to `<crop>_fruit___healthy` for crops in this taxonomy | ~90,000 | lab |

## `unknown` class negatives (used)

All negatives are CC0 or CC BY. Imagenette (ImageNet terms), DTD and Oxford Flowers (research use only) were removed.

| Source | License | What it adds | Images used |
|---|---|---|---|
| Open Images V4+ validation set, per-image list `storage.googleapis.com/openimages/2018_04/validation/validation-images-with-rotation.csv`, images from `open-images-dataset.s3.amazonaws.com` | CC BY 2.0. Only images whose `License` column is CC BY 2.0 are used; author and URL are kept per image in `IMAGE_ATTRIBUTIONS.csv` | **objects:** images with no plant/food/crop label (people, hands, vehicles, buildings, tools, animals, rooms) | up to 6,000 |
| same, "flora" filter | CC BY 2.0 (per image) | **non-crop plants:** flowers, trees, houseplants, lawns, hedges, with no fruit/vegetable/crop label | up to 3,000 |
| Poly Haven textures, api.polyhaven.com | CC0 | textures: soil, sand, rock, concrete, wood, fabric, brick (vegetation textures excluded) | up to 2,400 crops from ~400 textures |
| `Project-AgML/DeepWeeds_classification` | CC BY 4.0 | weeds and the "Negative" class (soil, grass, rangeland) | up to 6,000 |
| `Project-AgML/Plant_leaf_diseases_dataset_classification`, class "Background_without_leaves" | CC BY 4.0 | empty lab and field backgrounds | ~1,100 |
| `LibreYOLO/hand-gestures-jps7z` (Roboflow) | CC BY 4.0 | hands | up to 2,000 |
| `Project-AgML/tree_species_classification_slovak_normal_cropped` | CC BY 4.0 | trees and bark | up to 2,000 |

## Commercial use (`COMMERCIAL_SAFE = True`, the notebook default)

These classification sources are skipped:

| Source | Why |
|---|---|
| `cotton_leaf_disease_classification`, `eggplant_leaf_disease_classification` | CC BY-NC 4.0 |
| `MangoLeafBD_disease_classification` | CC BY-NC 3.0 (mango is then not covered) |
| `timm/plant-pathology-2021` | The mirror says Apache-2.0, but the data comes from a Kaggle competition with no clear license from the publisher |

What stays has conditions to meet:
- **CC BY:** you must give credit. The notebook writes `DATASET_CREDITS.csv` (per source) and `IMAGE_ATTRIBUTIONS.csv` (per image for Open Images).
- **CC BY-SA:** PlantVillage (CC BY-SA 3.0 per its Zenodo record 1204914) and Global Wheat Head (detector) also require that any dataset you redistribute from them uses the same license. Whether share-alike reaches trained model weights is legally unsettled; get advice before selling the model.
- **Not legal advice:** licenses are as stated by the publishers and mirrors on 2026-11-22. Open Images states that it lists images as CC BY 2.0 but does not guarantee it.

## Detector sources (used)

All boxes are remapped to 4 classes: `0 leaf`, `1 fruit`, `2 ear` (wheat head, rice panicle), `3 pest`.

| Class | Source | License | Images |
|---|---|---|---|
| leaf | PlantDoc OD (GitHub, official train/test split) | CC BY 4.0 | 2,569 |
| leaf | `Project-AgML/tea_leaf_disease_pest_detection` | CC BY 4.0 | 9,591 (capped) |
| fruit | `Project-AgML/truss_tomato_detection_greenhouse` (mature, raw) | CC BY 4.0 | 4,504 |
| fruit | `Project-AgML/coffee_detection` (cherries) | CC BY 4.0 | 3,254 |
| fruit | `Project-AgML/strawberry_growth_detection` (flowers dropped) | CC BY 4.0 | 1,477 |
| fruit | `Project-AgML/grapevine_bunch_detection` | CC BY 4.0 | 10,010 (capped) |
| fruit | `Project-AgML/raspberry_maturity_detection` (berries only) | CC BY 4.0 | 2,039 |
| fruit | `Project-AgML/litchi_fruit_detection` | CC BY 4.0 | 1,880 |
| fruit | `Project-AgML/banana_bunch_detection` | CC BY 4.0 | 2,179 |
| fruit | `Project-AgML/date_cluster_detection` | CC BY 4.0 | 5,530 (capped) |
| ear | `Project-AgML/wheat_head_counting` (Global Wheat Head) | CC BY-SA 4.0 | 6,512 (capped) |
| ear | `Project-AgML/SDAU_wheat_head_detection` | CC BY 4.0 | 3,030 |
| ear | `Project-AgML/rice_panicle_detection` (raw) | CC BY 4.0 | 2,193 |
| pest | `LibreYOLO/insects-mytwu` (RF100 crop insects) | CC BY 4.0 | ~1,000 |
| pest | `LibreYOLO/pests-2xlvx` (RF100 light-trap pests) | CC BY 4.0 | ~1,000 |

Every detection source labels only its own class. A fruit photo has no leaf boxes, so leaves in it count as background. The notebook does one pseudo-labeling pass to fill these gaps, and reports mAP per class on each source's held-out images.

## Optional sources (need a free account key)

These are skipped unless a key is added to Colab secrets.

| Crop | Source | License | Why optional |
|---|---|---|---|
| lettuce | universe.roboflow.com/yssp/disease-lettuce-2 | CC BY 4.0 | needs `ROBOFLOW_API_KEY` |
| olive | universe.roboflow.com/baraah/olive-s-leaf-diseases-tvce5 | CC BY 4.0 | needs `ROBOFLOW_API_KEY` |

## Checked and rejected

| Source | Reason |
|---|---|
| PlantWild (`Voxel51/PlantWild`) | CC BY-NC-ND 4.0 (no derivatives) |
| iCassava 2019 / Kaggle Cassava Leaf Disease (`dpdl-benchmark/cassava`, `Engineer101/cassava-…`) | Kaggle competition data. The mirror's MIT tag does not come from the publisher, and no license was found at the source. Cassava is covered by CCMT instead. |
| `Project-AgML/cucumber_disease_classification` | No license on the mirror or the found source. Every class has exactly 960 images, which points to augmentation. Cucumber is covered by `plant_leaf_disease_classification` instead. |
| `Project-AgML/pepper_disease_pest_classification` | Crop identity is unclear (bell pepper, chili or black pepper?), and the even ~5k per class points to augmentation. |
| `Project-AgML/tomato_leaf_disease` | A copy of the PlantVillage tomato classes, so it duplicates data already used. |
| `Project-AgML/wheat_disease_detection` | Category names are unpublished ("0"–"6"). |
| `Project-AgML/barley_disease_segmentation` | Masks without disease names. No usable barley classification data was found. |
| `Spitblaze/Corn_or_Maize_Leaf_Disease_Dataset` | License "unknown" |
| `Project-AgML/apple_detection_usa`, `fruit_detection_worldwide`, `mango_detection_australia` | No license stated |
| Strawberry Disease Detection (Afzaal 2021, Mendeley k2ptxmfjhj) | License not confirmed (only "academic and research") |
| Wheat Plant Diseases Dataset (Zenodo 15056570) | Only a PDF that points to a commercial download page |
| `Project-AgML/FruitVision_quality_classification` | CC BY-NC-ND 4.0 |
| Imagenette / ImageNet | ImageNet images are for non-commercial research |
| DTD textures | research use only |
| Oxford 102 Flowers (`pufanyi/flowers102`) | Original is research use; the mirror's CC BY tag does not come from the publisher |
| TensorFlow `flower_photos` | Per-image licenses could not be confirmed |

## Coverage gaps (no verified free data found)

- **Barley:** nothing usable.
- **Mango leaf diseases:** the only set is non-commercial, so it is skipped when `COMMERCIAL_SAFE = True`. Mango fruit identity still comes from Fruits-360.
- **Pea, carrot, lettuce, cabbage, pumpkin, olive, pear fruit, peach fruit:** no leaf or fruit disease data, or only through the optional Roboflow key. Fruits-360 still gives these crops a `<crop>_fruit___healthy` class where it has images.
- **Wheat:** only 999 field images (~200 per class). Wheat accuracy will be the least reliable.
- **Cassava:** only CCMT (Ghana), so no cross-source test is possible.
- **Pests:** the detector learns a generic `pest` box, not insect species.

## Sources

- Hugging Face Hub API (`/api/datasets?author=Project-AgML`, 536 datasets with license tags), and datasets-server `/info`, `/statistics` and `/size` for class names, counts and sizes
- GitHub API license endpoint for PlantDoc (CC BY 4.0), PlantVillage (no license file) and Fruits-360 (MIT)
- Zenodo API, record 7573133 (CC BY 4.0, 999 images)
- Paddy Doctor: [IEEE DataPort](https://ieee-dataport.org/node/10108), [arXiv 2205.11108](https://arxiv.org/pdf/2205.11108), [OpenAlex](https://api.openalex.org/works/doi:10.21227/HZ4V-AF08)
- iCassava: [arXiv 1908.02900](https://arxiv.org/pdf/1908.02900), [TFDS catalog](https://www.tensorflow.org/datasets/catalog/cassava)
- Strawberry: [Mendeley k2ptxmfjhj](https://data.mendeley.com/datasets/k2ptxmfjhj)
- Olive: [Roboflow baraah](https://universe.roboflow.com/baraah/olive-s-leaf-diseases-tvce5)
- Lettuce: [Roboflow yssp](https://universe.roboflow.com/yssp/disease-lettuce-2)
