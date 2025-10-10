/**
 * External dependencies
 */
import deepMerge from 'deepmerge';

/**
 * WordPress dependencies
 */
import { privateApis, Spinner } from '@wordpress/components';
import { useCallback, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { DataFormControlProps } from '../types';
import { unlock } from '../lock-unlock';
import useElements from '../hooks/use-elements';

const { ValidatedRadioControl } = unlock( privateApis );

export default function Radio< Item >( {
	data,
	field,
	onChange,
	hideLabelFromVision,
}: DataFormControlProps< Item > ) {
	const { label, description, getValue, setValue } = field;
	const { elements, isLoading } = useElements(
		field.elements,
		field.getElements
	);
	const value = getValue( { item: data } );
	const [ customValidity, setCustomValidity ] =
		useState<
			React.ComponentProps<
				typeof ValidatedRadioControl
			>[ 'customValidity' ]
		>( undefined );

	const onChangeControl = useCallback(
		( newValue: string ) =>
			onChange( setValue( { item: data, value: newValue } ) ),
		[ data, onChange, setValue ]
	);

	const onValidateControl = useCallback(
		( newValue: any ) => {
			const message = field.isValid?.custom?.(
				deepMerge(
					data,
					setValue( {
						item: data,
						value: newValue,
					} ) as Partial< Item >
				),
				field
			);

			if ( message ) {
				setCustomValidity( {
					type: 'invalid',
					message,
				} );
				return;
			}

			setCustomValidity( undefined );
		},
		[ data, field, setValue ]
	);

	if ( isLoading ) {
		return <Spinner />;
	}

	if ( elements.length === 0 ) {
		return null;
	}

	return (
		<ValidatedRadioControl
			required={ !! field.isValid?.required }
			onValidate={ onValidateControl }
			customValidity={ customValidity }
			label={ label }
			help={ description }
			onChange={ onChangeControl }
			options={ elements }
			selected={ value }
			hideLabelFromVision={ hideLabelFromVision }
		/>
	);
}
