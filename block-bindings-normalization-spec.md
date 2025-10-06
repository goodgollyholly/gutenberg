# Block Bindings Normalization Specification

## Overview

This specification outlines the changes required to eliminate the `core/entity` block binding source by enhancing the existing `core/post-data` and `core/term-data` sources to support attribute-based data retrieval and URL generation. The goal is to create a unified approach where navigation blocks programmatically choose between Post and Term bindings based on the `kind` attribute, while the bindings themselves use the `type` attribute to resolve the specific post type or taxonomy.

## Current State Analysis

### Entity Block Bindings (`core/entity`)

-   **Data Source**: Block attributes (`id`, `type`, `kind`)
-   **Context**: None
-   **Supported Keys**: Only `url`
-   **Entity Types**: `post-type` and `taxonomy`
-   **Status**: To be eliminated

### Post Data Block Bindings (`core/post-data`)

-   **Data Source**: Block context (`postId`)
-   **Context**: `['postId']`
-   **Supported Keys**: `date`, `modified`
-   **Entity Types**: Posts only
-   **Status**: To be enhanced

### Term Data Block Bindings (`core/term-data`)

-   **Data Source**: Block context (`termId`, `taxonomy`)
-   **Context**: `['taxonomy', 'termId', 'termData']`
-   **Supported Keys**: `id`, `name`, `slug`, `link`, `description`, `parent`, `count`
-   **Entity Types**: Terms only
-   **Status**: To be enhanced

## Required Changes

### 1. Post Data Block Bindings Enhancement

File: `lib/compat/wordpress-6.9/post-data-block-bindings.php`

Changes Required:

1. Add attribute-based data retrieval logic:

    ```php
    // Check attributes first, fall back to context only if attributes not available
    $entity_id = $block_instance->attributes['id'] ?? null;

    // Only use context if attributes are not available
    if ( empty( $entity_id ) ) {
        $entity_id = $block_instance->context['postId'] ?? null;
    }
    ```

2. Add `link` key support:

    ```php
    if ( 'link' === $source_args['key'] ) {
        // Post Data source only handles post-type entities
        $post_id = $entity_id;
        $permalink = get_permalink( $post_id );
        return is_wp_error( $permalink ) ? null : esc_url( $permalink );
    }
    ```

3. Update context requirements:

    ```php
    // Make context optional when attributes are present
    if ( empty( $entity_id ) && empty( $block_instance->context['postId'] ) ) {
        return null;
    }
    ```

4. Registration remains the same but treat `uses_context` as optional at runtime:

    ```php
    register_block_bindings_source(
        'core/post-data',
        array(
            'label'              => _x( 'Post Data', 'block bindings source' ),
            'get_value_callback' => 'gutenberg_block_bindings_post_data_get_value',
            'uses_context'       => array( 'postId' ), // Optional in practice
        )
    );
    ```

### 2. Term Data Block Bindings Enhancement

File: `lib/compat/wordpress-6.9/term-data-block-bindings.php`

Changes Required:

1. Add attribute-based data retrieval logic:

    ```php
    // Check attributes first, fall back to context only if attributes not available
    $entity_id = $block_instance->attributes['id'] ?? null;
    $type      = $block_instance->attributes['type'] ?? '';

    // Only use context if attributes are not available
    if ( empty( $entity_id ) ) {
        $entity_id = $block_instance->context['termId'] ?? null;
        $taxonomy = $block_instance->context['taxonomy'] ?? '';
    } else {
        // Use type from attributes for taxonomy
        $taxonomy = ( 'tag' === $type ) ? 'post_tag' : $type;
    }
    ```

2. Update `link` key to handle taxonomy entities only:

    ```php
    case 'link':
        // Term Data source only handles taxonomy entities
        return esc_url( get_term_link( $term ) );
        break;
    ```

3. Update context requirements:

    ```php
    // Make context optional when attributes are available
    if ( empty( $entity_id ) && ( empty( $block_instance->context['termId'] ) || empty( $block_instance->context['taxonomy'] ) ) ) {
        return null;
    }
    ```

4. Registration remains the same but treat `uses_context` as optional at runtime:

    ```php
    register_block_bindings_source(
        'core/term-data',
        array(
            'label'              => _x( 'Term Data', 'block bindings source' ),
            'get_value_callback' => 'gutenberg_block_bindings_term_data_get_value',
            'uses_context'       => array( 'taxonomy', 'termId', 'termData' ), // Optional in practice
        )
    );
    ```

### 3. JavaScript Bindings Enhancement

File: `packages/editor/src/bindings/post-data.js`

Changes Required:

1. Add attribute-based data retrieval:

    ```js
    // Check attributes first
    const blockAttributes = getBlockAttributes( clientId );
    const entityId = blockAttributes?.id;

    // Fall back to context if attributes not available
    const postId = entityId || context?.postId;
    ```

2. Add `link` key support (in data fields or resolver):

    ```js
    link: {
        label: __( 'Link' ),
        value: entityDataValues?.link,
        type: 'string',
    },
    ```

File: `packages/editor/src/bindings/term-data.js`

Changes Required:

1. Add attribute-based data retrieval:

    ```js
    // Check attributes first
    const blockAttributes = getBlockAttributes( clientId );
    const entityId = blockAttributes?.id;
    const type = blockAttributes?.type;

    // Fall back to context if attributes not available
    const termId = entityId || context?.termId;
    const taxonomy =
    	( type === 'tag' ? 'post_tag' : type ) || context?.taxonomy;
    ```

2. Update `link` key for taxonomy entities only:

    ```js
    link: {
        label: __( 'Link' ),
        value: termDataValues?.link,
        type: 'string',
    },
    ```

### 4. Navigation Hook Update

File: `packages/block-library/src/navigation-link/shared/use-entity-binding.js`

Changes Required:

1. Update binding source selection (kind decides which binding to use):

    ```js
    const createBinding = useCallback( () => {
    	const { kind } = attributes;
    	// Use kind to determine which binding source to use
    	const source =
    		kind === 'post-type' ? 'core/post-data' : 'core/term-data';

    	updateBlockBindings( {
    		url: {
    			source: source,
    			args: { key: 'link' },
    		},
    	} );
    }, [ updateBlockBindings, attributes ] );
    ```

2. Update binding detection:

    ```js
    const hasUrlBinding = !! metadata?.bindings?.url && !! id;
    // Check if binding uses the correct source based on kind
    const { kind } = attributes;
    const expectedSource =
    	kind === 'post-type' ? 'core/post-data' : 'core/term-data';
    const hasCorrectBinding =
    	hasUrlBinding && metadata?.bindings?.url?.source === expectedSource;
    ```

### 5. Entity Source Removal

Files to Remove:

-   `lib/compat/wordpress-6.9/entity-block-bindings.php`
-   `packages/editor/src/bindings/entity.js`

Files to Update:

-   `lib/load.php` — Remove entity binding registration
-   `packages/editor/src/bindings/api.js` — Remove entity binding import and registration

## Testing Strategy

Use e2e tests for the key flows to validate the full editor→frontend pipeline, and a minimal unit test set only for the navigation hook logic.

Unit Tests

1. Navigation Hook Tests:

-   Test source selection based on `kind` attribute
-   Test binding creation and clearing
-   Test binding detection logic

E2E Tests

1. Navigation Link Block Tests:

-   Test post-type navigation links work with Post Data binding
-   Test taxonomy navigation links work with Term Data binding
-   Test switching between post-type and taxonomy entities
-   Test URL generation for both entity types

2. Navigation Submenu Block Tests:

-   Test submenu links work with both binding sources
-   Test nested navigation structure

3. Template Context Tests:

-   Test bindings work in template contexts
-   Test context fallback when attributes not available

## Implementation Order

1. Phase 1: Enhance Post Data Block Bindings

-   Add attribute-based data retrieval
-   Add `link` key support for post-type entities only
-   Update context requirements

2. Phase 2: Enhance Term Data Block Bindings

-   Add attribute-based data retrieval
-   Update `link` key for taxonomy entities only
-   Update context requirements

3. Phase 3: Update JavaScript Bindings

-   Update Post Data JavaScript binding
-   Update Term Data JavaScript binding

4. Phase 4: Update Navigation Hook

-   Update source selection logic based on `kind` attribute
-   Update binding detection
-   Add unit tests

5. Phase 5: Remove Entity Source

-   Remove entity binding files
-   Update registration files
-   Update imports

6. Phase 6: E2E Testing

-   Run comprehensive E2E tests
-   Verify navigation functionality
-   Test edge cases

## Success Criteria

-   Functionality: Navigation links work with both post-type and taxonomy entities
-   Performance: No performance regression in binding resolution
-   Compatibility: Existing context-based bindings continue to work
-   Code Quality: All tests pass, no linting errors
-   Documentation: Changes are documented in code where appropriate

## Key Design Principles

1. Mutual Exclusivity: Post and Term data sources are mutually exclusive — Post handles only post-type entities, Term handles only taxonomy entities
2. Kind-Based Selection: The `kind` attribute determines which binding source to use (`core/post-data` or `core/term-data`), while the `type` attribute is used within the bindings to determine the specific post type or taxonomy
3. Attribute Priority: Block attributes take priority over context — context is only used as a fallback when attributes are not available
4. Unified Key: Both sources use the `link` key for URL generation, maintaining consistency
