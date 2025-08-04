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

package com.infosys.icets.icip.icipwebeditor.model;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.Serializable;
import java.sql.Blob;
import java.sql.SQLException;

import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import com.infosys.icets.ai.comm.lib.util.listener.AuditListener;
import com.infosys.icets.icip.icipwebeditor.model.dto.ICIPBinaryFilesDTO;

import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

// TODO: Auto-generated Javadoc
// 
/**
 * The Class ICIPBinaryFiles.
 *
 * @author icets
 */
@EntityListeners(AuditListener.class)
@Entity
@Table(name = "mlpipelinebinaryentity")

/**
 * Gets the file.
 *
 * @return the file
 */

/**
 * Gets the filescript.
 *
 * @return the filescript
 */

/**
 * Gets the filescript.
 *
 * @return the filescript
 */
@Getter

/**
 * Sets the file.
 *
 * @param file the new file
 */

/**
 * Sets the filescript.
 *
 * @param filescript the new filescript
 */

/**
 * Sets the filescript.
 *
 * @param filescript the new filescript
 */
@Setter

/**
 * Instantiates a new ICIP binary files.
 */

/**
 * Instantiates a new ICIP binary files.
 */

/**
 * Instantiates a new ICIP binary files.
 */
@NoArgsConstructor

/**
 * Instantiates a new ICIP binary files.
 *
 * @param id           the id
 * @param cname        the cname
 * @param organization the organization
 * @param filename     the filename
 * @param file         the file
 */

/**
 * Instantiates a new ICIP binary files.
 *
 * @param id           the id
 * @param cname        the cname
 * @param organization the organization
 * @param filename     the filename
 * @param filescript   the filescript
 */

/**
 * Instantiates a new ICIP binary files.
 *
 * @param id the id
 * @param cname the cname
 * @param organization the organization
 * @param filename the filename
 * @param filescript the filescript
 */
@AllArgsConstructor

/**
 * Hash code.
 *
 * @return the int
 */

/**
 * Hash code.
 *
 * @return the int
 */
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class ICIPBinaryFiles implements Serializable {

	/** The Constant serialVersionUID. */
	private static final long serialVersionUID = 1L;

	/** The id. */
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@EqualsAndHashCode.Include
	private Integer id;

	/** The cname. */
	private String cname;

	/** The organization. */
	private String organization;

	/** The filename. */
	private String filename;

	/** The file. */
	private Blob filescript;

	/**
	 * To DTO.
	 *
	 * @return the ICIP binary files DTO
	 * @throws IOException Signals that an I/O exception has occurred.
	 * @throws SQLException the SQL exception
	 */
	public ICIPBinaryFilesDTO toDTO() throws IOException, SQLException {
		StringBuilder strBuilder = new StringBuilder(4096);
		try (BufferedReader br = new BufferedReader(new InputStreamReader(filescript.getBinaryStream()), 2048)) {
			String line;
			while ((line = br.readLine()) != null) {
				strBuilder.append(line);
			}
		}
		return new ICIPBinaryFilesDTO(id, cname, organization, filename, strBuilder.toString());
	}

	/**
	 * Equals.
	 *
	 * @param obj the obj
	 * @return the boolean value
	 */
	@Override
	public boolean equals(Object obj) {
		if (this == obj)
			return true;
		if (obj == null)
			return false;
		if (getClass() != obj.getClass())
			return false;
		ICIPBinaryFiles other = (ICIPBinaryFiles) obj;
		if (this.getId() == null) {
			if (other.getId() != null)
				return false;
		} else if (!id.equals(other.getId()))
			return false;
		return true;
	}

	/**
	 * hashCode.
	 *
	 * @return the hashcode
	 */
	@Override
	public int hashCode() {
		final int prime = 31;
		int result = 1;
		result = prime * result + ((this.getId() == null) ? 0 : id.hashCode());
		return result;
	}

}
