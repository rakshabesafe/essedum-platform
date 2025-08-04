/**
 * The MIT License (MIT)
 * Copyright © 2025 Infosys Limited
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”),
 * to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

package com.infosys.icets.iamp.usm.dto;



import java.io.Serializable;

import lombok.Getter;
import lombok.Setter;

// TODO: Auto-generated Javadoc
/**
 * The Class UserUnitDTO.
 *
 * @author icets
 */

/**
 * Gets the unit.
 *
 * @return the unit
 */

/**
 * Gets the unit.
 *
 * @return the unit
 */
@Getter

/**
 * Sets the unit.
 *
 * @param unit the new unit
 */

/**
 * Sets the unit.
 *
 * @param unit the new unit
 */
@Setter
public class UserUnitDTO implements Serializable {
	
	/** The id. */
	private Integer id;

	
	/** The context. */
	private ContextDTO context;

	
	/** The user. */
	private UsersDTO user;

	
	/** The unit. */
	private OrgUnitDTO unit;

	
}
