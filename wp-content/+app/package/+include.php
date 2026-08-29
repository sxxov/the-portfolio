<?php

namespace app\package;

use function bare\module\runtime\use_module_alias;
use function bare\utilities\url\get_uri;

$import_map = [
	'@lottiefiles/dotlottie-web' => 'https://cdn.jsdelivr.net/npm/@lottiefiles/dotlottie-web@0.57.0/+esm',

	'@pmndrs/vanilla/materials/MeshTransmissionMaterial.js' => 'https://cdn.jsdelivr.net/npm/@pmndrs/vanilla@1.21.1/materials/MeshTransmissionMaterial.min.js',

	'@sparkjsdev/spark' => 'https://cdn.jsdelivr.net/gh/sparkjsdev/spark@7c6e7452fd635f955003e3a885718d47b9f7f2cf/dist/spark.module.js',

	'@theatre/core' => get_uri(__DIR__ . '/overrides/@theatre/core/index.js'),
	'@theatre/studio' => get_uri(__DIR__ . '/overrides/@theatre/studio/index.js'),

	'iterator-helpers-polyfill' => 'https://cdn.jsdelivr.net/npm/iterator-helpers-polyfill@3.0.1/+esm',

	'pawe' => 'https://cdn.jsdelivr.net/npm/pawe@0.1.5/+esm',
	'pawe/api' => 'https://cdn.jsdelivr.net/npm/pawe@0.1.5/api/+esm',

	'postprocessing' => 'https://cdn.jsdelivr.net/npm/postprocessing@6.37.6/+esm',

	'three' => 'https://cdn.jsdelivr.net/npm/three@0.178.0/+esm',
	'three/addons/controls/OrbitControls.js' => 'https://cdn.jsdelivr.net/npm/three@0.178.0/addons/controls/OrbitControls.js/+esm',
	'three/addons/controls/TrackballControls.js' => 'https://cdn.jsdelivr.net/npm/three@0.178.0/addons/controls/TrackballControls.js/+esm',
	'three/addons/controls/TransformControls.js' => 'https://cdn.jsdelivr.net/npm/three@0.178.0/addons/controls/TransformControls.js/+esm',
	'three/addons/lights/RectAreaLightUniformsLib.js' => 'https://cdn.jsdelivr.net/npm/three@0.178.0/addons/lights/RectAreaLightUniformsLib.js/+esm',
	'three/addons/loaders/DRACOLoader.js' => 'https://cdn.jsdelivr.net/npm/three@0.178.0/addons/loaders/DRACOLoader.js/+esm',
	'three/addons/loaders/EXRLoader.js' => 'https://cdn.jsdelivr.net/npm/three@0.178.0/addons/loaders/EXRLoader.js/+esm',
	'three/addons/loaders/GLTFLoader.js' => 'https://cdn.jsdelivr.net/npm/three@0.178.0/addons/loaders/GLTFLoader.js/+esm',
	'three/addons/loaders/LUTCubeLoader.js' => 'https://cdn.jsdelivr.net/npm/three@0.178.0/addons/loaders/LUTCubeLoader.js/+esm',
];

foreach ($import_map as $alias => $uri)
	use_module_alias($alias, $uri);
